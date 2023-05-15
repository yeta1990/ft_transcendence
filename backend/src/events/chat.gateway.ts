import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';

//https://stackoverflow.com/questions/69435506/how-to-pass-a-dynamic-port-to-the-websockets-gateway-in-nestjs
@WebSocketGateway({ namespace: '/chat', cors: true } )
//extending BaseGateway to log the gateway creation in the terminal
export class ChatGateway extends BaseGateway {

  constructor() {
	super(ChatGateway.name);
  }
  //return object has two elements:
  // - event: type of event that the client will be listening to
  // - data: the content
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): any {
  	  console.log("ha llegado un mensaje");
    return { event: 'message', data: payload};
  }

  @SubscribeMessage('join')
  handleJoin(client: any, payload: any): any {
  	  console.log("ha llegado un mensaje join");
    return { event: 'join', data: payload};
  }
 
}
