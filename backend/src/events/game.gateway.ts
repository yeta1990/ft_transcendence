import {Logger} from '@nestjs/common'
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';

@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor() {
  	super();
  	this.gatewayName = "ChatGateway"
	this.logger = new Logger(this.gatewayName);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): any {
    return { event: 'message', data: payload};
  }
}
