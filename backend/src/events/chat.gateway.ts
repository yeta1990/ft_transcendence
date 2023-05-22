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
	return { event: 'system', data: response};
  }

  //in case it arrives different rooms separated by comma,
  // the rooms param is splitted
  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, rooms: string): void {//WsResponse<unknown>{
  	  console.log("join message received: " + rooms);
	  const splittedRooms: Array<string> = rooms.split(",");
	  let lastJoinedRoom: string;
	  let newRoomCreated: boolean = false;
	  const adapter: any = this.server.adapter;
	  const roomsRaw: any = adapter.rooms;

	  splittedRooms.forEach((room) => {
	  	  if (room.length > 0 && room[0] != '#'){
	  	  	lastJoinedRoom = '#' + room;
	  	  } else {
	  	  	lastJoinedRoom = room;
	  	  }
		  if (!roomsRaw.has(room))
		  	  newRoomCreated = true;
		  this.joinUserToRoom(client.id, lastJoinedRoom);
	  })

	  if (newRoomCreated){
		  this.emit('listRooms', this.getActiveRooms());
	  }
  
		const response: ChatMessage = {
			room: lastJoinedRoom,
			message: `you are in room ${lastJoinedRoom}`,
			nick: "system",
			date: new Date()
		}
	const joinBroadCast: ChatMessage = {
		room: lastJoinedRoom,
		message: `${client.id} joined ${lastJoinedRoom}`,
		nick: "system",
		date: new Date()
	}
	  this.broadCastToRoom('join', response);
//	  this.broadCastToRoom('system', joinBroadCast);

//	  return { event: 'join', data: response};
  }

  @SubscribeMessage('listRooms')
  listRooms(client: Socket): WsResponse<unknown>{
	  return { event: 'listRooms', data: this.getActiveRooms()}
  }

  @SubscribeMessage('listRoomUsers')
  listRoomUsers(client:Socket, room: string): WsResponse<unknown>{
	 return { event: 'listRoomUsers', data: this.getUsersFromRoom(room)}

  }

 
}
