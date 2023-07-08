import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload } from '@shared/types';

@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor() {
	super(GameGateway.name);
  }

  async afterInit(): Promise<void> {}
  /*
  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> {
    return { event: 'message', data: payload};
  }*/
   
  @SubscribeMessage('up')
  handleUp(client: Socket, payload: ChatMessage) {
    console.log("Going up\n");
    return { event: 'getSignal', data: -1 };
  }

  @SubscribeMessage('down')
  handleDown(client: Socket, payload: ChatMessage) {
    console.log("Going down\n");
    return { event: 'getSignal', data: 1 };
  }
}
