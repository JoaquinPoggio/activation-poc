import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Lo que recibe la UI por cada cambio de una activación
export interface TimelineMessage {
  activationId: string;
  customerId: string;
  eventType: string;
  at: string;
  status: string;
}

// Comparte el puerto 3000 con la API HTTP. CORS abierto porque la UI corre en el 5173.
@WebSocketGateway({ cors: { origin: '*' } })
export class ActivationGateway {
  @WebSocketServer()
  server!: Server;

  notify(message: TimelineMessage) {
    this.server.emit('activation.update', message);
  }
}