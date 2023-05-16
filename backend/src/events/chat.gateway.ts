import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage } from '@shared/types';

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
  handleMessage(client: Socket, payload: ChatMessage): void { //WsResponse<unknown>{
	this.broadCastToRoom(payload.room, 'message', payload.message);

//    return { event: 'message', data: payload.message};
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, room: string): WsResponse<unknown>{
	  this.joinUserToRoom(client.id, room); 
	  this.broadCastToRoom(room, 'join', "new user joined room");
	  return { event: 'join', data: room};
  }
 
}
