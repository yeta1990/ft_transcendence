import {   MessageBody, WebSocketServer, SubscribeMessage, WebSocketGateway , WsResponse} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

//@WebSocketGateway({ cors: { origin: [process.env.FRONTEND_IP, 'http://localhost:3000', 'http://localhost:4200']}}
@WebSocketGateway({ namespace: '/chat', cors: { origin: [process.env.FRONTEND_IP, 'http://localhost:3000', 'http://localhost:4200']}}
)
//https://github.com/nestjs/nest/blob/master/sample/02-gateways/src/events/events.gateway.ts
export class ChatGateway {

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): any {
    return { event: 'message', data: payload};
  }
 
  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
