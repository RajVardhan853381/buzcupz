import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  namespace: "/reservations",
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class ReservationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ReservationsGateway.name);
  private readonly clients = new Map<string, { restaurantId: string }>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      this.clients.set(client.id, { restaurantId: payload.restaurantId });

      client.join(`restaurant:${payload.restaurantId}`);
      this.logger.log(`Client ${client.id} connected to reservations`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage("subscribe-reservations")
  handleSubscribe(@ConnectedSocket() client: Socket) {
    const info = this.clients.get(client.id);
    if (info) {
      client.join(`reservations:${info.restaurantId}`);
      return { success: true };
    }
    return { success: false };
  }

  broadcastNewReservation(restaurantId: string, reservation: any) {
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit("reservation:new", reservation);
    this.logger.log(
      `Broadcasted new reservation: ${reservation.confirmationCode}`,
    );
  }

  broadcastReservationUpdate(restaurantId: string, reservation: any) {
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit("reservation:updated", reservation);
    this.logger.log(
      `Broadcasted reservation update: ${reservation.confirmationCode}`,
    );
  }

  broadcastTableUpdate(restaurantId: string, tableId: string) {
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit("table:updated", { tableId });
  }
}
