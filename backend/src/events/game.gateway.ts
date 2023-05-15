import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';

@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor() {
	super(GameGateway.name);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): any {
    return { event: 'message', data: payload};
  }
}
