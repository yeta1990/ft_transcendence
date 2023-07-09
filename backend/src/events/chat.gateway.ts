import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload } from '@shared/types';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { RoomMessages, ChatUser } from '@shared/types';

//https://stackoverflow.com/questions/69435506/how-to-pass-a-dynamic-port-to-the-websockets-gateway-in-nestjs
@WebSocketGateway({ namespace: '/chat', cors: true } )
//extending BaseGateway to log the gateway creation in the terminal
export class ChatGateway extends BaseGateway {

  constructor(private chatMessageService: ChatMessageService) {
	super(ChatGateway.name);
  }


  //separate afterInit from the base class
  async afterInit(): Promise<void> {}
  //return object has two elements:
  // - event: type of event that the client will be listening to
  // - data: the content
  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> { 
	const nick: string = client.handshake.query.nick as string;
	if (await this.chatService.isUserInRoom(payload.room, nick)){
    	payload.nick = client.handshake.query.nick as string;
		this.broadCastToRoom('message', payload);
		await this.chatMessageService.saveMessage(payload)
	} 
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
//  	  console.log("join message received: " + rooms);
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
		  let isUserAlreadyActiveInRoom: boolean = false;
		  try {
		  	const activeUsersInRoom: Array<ChatUser> = this.getActiveUsersInRoom(room);
    		for (let i = 0; i < activeUsersInRoom.length; i++){
  				if (client.id === activeUsersInRoom[i].client_id){
  					isUserAlreadyActiveInRoom = true;
  					break ;
  				}
  		    }
		  } catch {}

		  const successfulJoin = await 
			this.joinUserToRoom(client, lastJoinedRoom, pass);

		  if (successfulJoin){
	 	  	const response: ChatMessage = {
		  	    room: lastJoinedRoom,
		  	    message: `you are in room ${lastJoinedRoom}`,
		  	    nick: "system",
		  	    date: new Date()
		  	}
			this.messageToClient(client.id, "join", response);
			if (!isUserAlreadyActiveInRoom){ 
				const oldMessagesInRoom: RoomMessages = 
					await this.chatMessageService.getAllMessagesFromRoom(lastJoinedRoom);
				for (let message of oldMessagesInRoom.messages){
					this.messageToClient(client.id, "message", message)
				}
			}
		  }
	  }
  }

  @SubscribeMessage('listAllRooms')
  async listRooms(client: Socket): Promise<WsResponse<unknown>>{
	  return { event: 'listAllRooms', data: await this.chatService.getAllRooms()}
  }

  @SubscribeMessage('listMyJoinedRooms')
  async listMyJoinedRooms(client: Socket): Promise<WsResponse<unknown>>{
	  const nick: string = client.handshake.query.nick as string;
	  return { event: 'listMyJoinedRooms', data: await this.chatService.getAllJoinedRoomsByOneUser(nick)}
  }

  @SubscribeMessage('admin')
  async makeRoomAdmin(client: Socket, payload: ChatMessage){
	  const nick: string = client.handshake.query.nick as string;
	  const adminOk: boolean = await this.chatService.makeRoomAdmin(nick, payload.nick, payload.room);
  } 

  @SubscribeMessage('noadmin')
  async removeRoomAdmin(client: Socket, payload: ChatMessage){
	  const nick: string = client.handshake.query.nick as string;
	  const adminRemoved: boolean = await this.chatService.removeRoomAdmin(nick, payload.nick, payload.room);
  } 

  @SubscribeMessage('ban')
  async banUserOfRoom(client: Socket, payload: ChatMessage){
	  const nick: string = client.handshake.query.nick as string;
	  const activeUsersInRoom: Array<ChatUser> = this.getActiveUsersInRoom(payload.room);
	  let targetUserConnectedSocketId: string | undefined = undefined;

	  for (let activeUser of activeUsersInRoom){
		if (activeUser.nick === payload.nick){
			targetUserConnectedSocketId = activeUser.client_id;
			break ;
		}
	  }

	  const banOk: boolean = await this.chatService.banUserOfRoom(nick, payload.nick, payload.room);
	  if (banOk && targetUserConnectedSocketId){
		this.server.to(targetUserConnectedSocketId)
			.emit("listMyJoinedRooms", await this.chatService.getAllJoinedRoomsByOneUser(payload.nick));
		const err: ChatMessage = {
			room: payload.room,
			message: `Information: you have been banned from ${payload.room}`,
			nick: "system",
			date: new Date()
		}
		this.messageToClient(targetUserConnectedSocketId, "system", err);
  	  }
  }

  @SubscribeMessage('noban')
  async removeBanOfRoom(client: Socket, payload: ChatMessage){
	  const nick: string = client.handshake.query.nick as string;
	  const banRemoved: boolean = await this.chatService.removeBanOfRoom(nick, payload.nick, payload.room);
  } 

  //part == to leave a room
  @SubscribeMessage('part')
  async part(client: Socket, room: string): Promise<WsResponse<unknown>>{
	const response: ChatMessage = {
  		room: room,
  		message: "you've left " + room,
  		nick: "system",
  		date: new Date()
  	}
	const nick: string = client.handshake.query.nick as string;
	const successfulPart: boolean = await this.removeUserFromRoom(client.id, room, nick);
	if (successfulPart){
		this.server.to(client.id).emit("listMyJoinedRooms", await this.chatService.getAllJoinedRoomsByOneUser(nick));
    	return { event: 'system', data: response};
	}
	response.message = "error: maybe the room " + room + " doesn't exist, or you aren't part of that room"
    return { event: 'system', data: response};
  }
 
}
