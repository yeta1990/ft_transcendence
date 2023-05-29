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
  //the command allows this structure: /join [#]channel[,channel] [pass]
  @SubscribeMessage('join')
  async handleJoinRoom(client: Socket, rooms: string): Promise<void>{
  	  console.log("join message received: " + rooms);
	  const splittedRooms: Array<string> = rooms.split(" ", 1)[0].split(",");
	  const pass: string | undefined = rooms.split(" ")[1];
	  let lastJoinedRoom: string;
	  const adapter: any = this.server.adapter;
	  const roomsRaw: any = adapter.rooms;

	  for (let room of splittedRooms) {
	  	  if (room.length > 0 && room[0] != '#'){
	  	  	lastJoinedRoom = '#' + room;
	  	  } else {
	  	  	lastJoinedRoom = room;
	  	  }
		  const successfulJoin = await this.joinUserToRoom(client.id, lastJoinedRoom, pass);

	 	  const response: ChatMessage = {
			  room: lastJoinedRoom,
			  message: `you are in room ${lastJoinedRoom}`,
			  nick: "system",
			  date: new Date()
		  }
		  if (successfulJoin){
			this.messageToClient(client.id, "join", response);
		  }
		  else{
		  	  const err: ChatMessage = {
			 	 room: lastJoinedRoom,
			     message: `Error: bad password provided for ${lastJoinedRoom}`,
			     nick: "system",
			     date: new Date()
		      }
		  	  this.messageToClient(client.id, "system", response);
		  }
	  }
  }

  @SubscribeMessage('listRooms')
  listRooms(client: Socket): WsResponse<unknown>{
	  return { event: 'listRooms', data: this.getActiveRooms()}
      const adapter: any = this.server.adapter;
	  const roomsRaw: any = adapter.rooms;
	  return { event: 'listRooms', data: Array.from(roomsRaw.keys()).filter(x => x[0] == '#')};
  }
 
}
