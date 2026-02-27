import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    namespace: '/inventory',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(InventoryGateway.name);
    private readonly clients = new Map<string, { restaurantId: string }>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            this.clients.set(client.id, { restaurantId: payload.restaurantId });

            client.join(`restaurant:${payload.restaurantId}`);
            client.join(`inventory:${payload.restaurantId}`);

            this.logger.log(`Client ${client.id} connected to inventory namespace`);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.clients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('subscribe-inventory')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        const info = this.clients.get(client.id);
        if (info) {
            client.join(`inventory:${info.restaurantId}`);
            return { success: true };
        }
        return { success: false };
    }

    broadcastInventoryUpdate(restaurantId: string, data: any) {
        this.server
            .to(`inventory:${restaurantId}`)
            .emit('inventory:updated', data);
        this.logger.debug(`Broadcasted inventory update: ${data.action}`);
    }

    broadcastAlert(restaurantId: string, alert: any) {
        this.server
            .to(`inventory:${restaurantId}`)
            .emit('inventory:alert', alert);
        this.logger.log(`Broadcasted alert: ${alert.message}`);
    }

    broadcastStockMovement(restaurantId: string, movement: any) {
        this.server
            .to(`inventory:${restaurantId}`)
            .emit('inventory:movement', movement);
    }
}
