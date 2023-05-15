import { MessageBody, 
	WebSocketServer, 
	SubscribeMessage, 
	WebSocketGateway, 
	WsResponse,
	OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { Logger } from '@nestjs/common';

//https://stackoverflow.com/questions/69435506/how-to-pass-a-dynamic-port-to-the-websockets-gateway-in-nestjs

@WebSocketGateway({ namespace: '/chat', cors: true } )
//@WebSocketGateway({ namespace: '/chat', cors: { origin: [process.env.FRONTEND_IP, 'http://localhost:3000', 'http://localhost:4200']}})

//https://github.com/nestjs/nest/blob/master/sample/02-gateways/src/events/events.gateway.ts
//@WebSocketGateway()
export class ChatGateway implements OnGatewayInit {

  private readonly logger = new Logger(ChatGateway.name)

  @WebSocketServer()
  server: Server;

  afterInit(): void {
	this.logger.log('Chat gateway initialized');
  }

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
