import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload } from '@shared/types';

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
	const nick: string = client.handshake.query.nick as string;
    payload.nick = client.handshake.query.nick as string;
	this.broadCastToRoom('message', payload);
  }

  //return a response directly to the client
  @SubscribeMessage('help')
  handleHelp(client: Socket, payload: ChatMessage): WsResponse<unknown>{
	const response: ChatMessage = {
		room: payload.room,
		message: "help response",
		nick: "system",
		date: new Date()
	}
	return { event: 'help', data: response};
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, room: string): WsResponse<unknown>{
	  this.joinUserToRoom(client.id, room); 
//	  this.broadCastToRoom('join', "new user joined room");
	  return { event: 'join', data: room};
  }

  @SubscribeMessage('listRooms')
  listRooms(client: Socket): WsResponse<unknown>{
//	  this.joinUserToRoom(client.id, room);
//	  this.broadCastToRoom(room, 'join', "new user joined room");
	  console.log("rooms " + Array.from(client.rooms));
	  return { event: 'listRooms', data: Array.from(client.rooms)};
  }
 
}
