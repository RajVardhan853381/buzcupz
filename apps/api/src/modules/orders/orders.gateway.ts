import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    namespace: '/orders',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OrdersGateway.name);
    private readonly connectedClients = new Map<string, { restaurantId: string; userId: string }>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);

            this.connectedClients.set(client.id, {
                restaurantId: payload.restaurantId,
                userId: payload.sub,
            });

            // Auto-join restaurant room
            client.join(`restaurant:${payload.restaurantId}`);

            this.logger.log(`Client ${client.id} connected to restaurant ${payload.restaurantId}`);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('join-kitchen')
    handleJoinKitchen(@ConnectedSocket() client: Socket) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            client.join(`kitchen:${clientInfo.restaurantId}`);
            this.logger.log(`Client ${client.id} joined kitchen room`);
            return { success: true };
        }
        return { success: false, error: 'Not authenticated' };
    }

    @SubscribeMessage('leave-kitchen')
    handleLeaveKitchen(@ConnectedSocket() client: Socket) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            client.leave(`kitchen:${clientInfo.restaurantId}`);
            return { success: true };
        }
        return { success: false };
    }

    /**
     * Broadcast new order to all connected clients
     */
    broadcastNewOrder(restaurantId: string, order: any) {
        this.server.to(`restaurant:${restaurantId}`).emit('order:new', order);
        this.server.to(`kitchen:${restaurantId}`).emit('order:new', order);
        this.logger.log(`Broadcasted new order ${order.orderNumber}`);
    }

    /**
     * Broadcast order status update
     */
    broadcastOrderUpdate(restaurantId: string, order: any) {
        this.server.to(`restaurant:${restaurantId}`).emit('order:updated', order);
        this.server.to(`kitchen:${restaurantId}`).emit('order:updated', order);
        this.logger.log(`Broadcasted order update: ${order.orderNumber} -> ${order.status}`);
    }

    /**
     * Notify when order is ready
     */
    notifyOrderReady(restaurantId: string, order: any) {
        this.server.to(`restaurant:${restaurantId}`).emit('order:ready', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            tableNumber: order.table?.number,
        });
    }
}
