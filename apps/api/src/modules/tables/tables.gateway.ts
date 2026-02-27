import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    namespace: '/tables',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class TablesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TablesGateway.name);
    private readonly clients = new Map<string, { restaurantId: string }>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            this.clients.set(client.id, { restaurantId: payload.restaurantId });

            client.join(`restaurant:${payload.restaurantId}`);
            client.join(`tables:${payload.restaurantId}`);

            this.logger.log(`Client ${client.id} connected to tables namespace`);
            client.emit('connected', { success: true });
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.clients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('subscribe-floor')
    handleSubscribeFloor(
        @ConnectedSocket() client: Socket,
        @MessageBody() floorId: string,
    ) {
        const info = this.clients.get(client.id);
        if (info) {
            client.join(`floor:${floorId}`);
            return { success: true, floorId };
        }
        return { success: false };
    }

    broadcastTableUpdate(restaurantId: string, data: any) {
        this.server.to(`tables:${restaurantId}`).emit('table:updated', data);
        this.logger.debug(`Broadcasted table update: ${data.action}`);
    }

    broadcastToFloor(floorId: string, event: string, data: any) {
        this.server.to(`floor:${floorId}`).emit(event, data);
    }
}
