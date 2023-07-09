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
			this.joinUserToRoom(client.id, client.handshake.query.nick as string, lastJoinedRoom, pass);

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

  ////////////////////////////
  // 	PRIVATE MESSAGES 	//
  ////////////////////////////

  // private messages are supported by fake/private channels which only
  // allows only 2 users
  // the name of that room is defined by the id of the 2 users, for instance:
  // id 4 wants to send a private message to id 2, the name of the channel
  // will be "#2-4", both ids, sorted asc, separated by a -
  //
  // [process]:
  // if the room doesn't exist in database:
  //	1. check if the user is banned by the other user
  // 	2. it's created in socket.io
  //	3. it's created in db
  //	4. user is joined in socket.io and saved in db
  //
  // if the room exists in db:
  //	1. check if the user is currently connected to the room. if it's, just continue. otherwise, follow the next steps
  //	4. user is joined in socket.io and saved in db
  //	
  // finally: send the message!
  // 	1. save it in the db
  //	2. send the message back to both users
  async isUserAlreadyActiveInRoom(clientSocketId: string, room: string){
	  try {
	  	const activeUsersInRoom: Array<ChatUser> = this.getActiveUsersInRoom(room);
	  		for (let i = 0; i < activeUsersInRoom.length; i++){
				if (clientSocketId === activeUsersInRoom[i].client_id){
					return true;
	  			}
	  	    }
	  } catch {}
	  return (false)
  }

  @SubscribeMessage('mp')
  async mp(client: Socket, payload: ChatMessage): Promise<void> {
	  const nick: string = client.handshake.query.nick as string;
	  const destinationNick: string = payload.room;
	  const privateRoomName: string = await this.chatService.generatePrivateRoomName(nick, destinationNick)
	  const joinedRoomsByEmisor: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(nick);
	  const joinedRoomsByDestination: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(destinationNick);
	  const emisorSocketIds = this.getClientSocketIdsFromNick(nick);
	  const destinationSocketIds = this.getClientSocketIdsFromNick(destinationNick);
 	  const response: ChatMessage = {
	  	    room: privateRoomName,
	  	    message: `you are in room ${privateRoomName}`,
	  	    nick: "system",
	  	    date: new Date()
	  }

	  for (let i = 0; i < emisorSocketIds.length; i++){
	  	  const successfulJoin = await this.joinUserToRoom(emisorSocketIds[i], nick, privateRoomName, undefined)
	  	  if (successfulJoin){
		  	 this.messageToClient(emisorSocketIds[i], "join", response);
			 if (!(await this.isUserAlreadyActiveInRoom(emisorSocketIds[i], privateRoomName))){ 
				const oldMessagesInRoom: RoomMessages = 
					await this.chatMessageService.getAllMessagesFromRoom(privateRoomName);
				for (let message of oldMessagesInRoom.messages){
					this.messageToClient(emisorSocketIds[i], "message", message)
				}
			}
	  	  }
	  }
	  for (let i = 0; i < destinationSocketIds.length; i++){
	  	  const successfulJoin = await this.joinUserToRoom(destinationSocketIds[i], destinationNick, privateRoomName, undefined)
	  	  if (successfulJoin){
		  	 this.messageToClient(destinationSocketIds[i], "joinmp", response);
			 if (!(await this.isUserAlreadyActiveInRoom(destinationSocketIds[i], privateRoomName))){ 
				const oldMessagesInRoom: RoomMessages = 
					await this.chatMessageService.getAllMessagesFromRoom(privateRoomName);
				for (let message of oldMessagesInRoom.messages){
					this.messageToClient(destinationSocketIds[i], "message", message)
				}
			 }
	  	  }
	  }

	  /*
	  if (successfulJoin){
		this.messageToClient(client.id, "join", response);
		if (!isUserAlreadyActiveInRoom){ 
			const oldMessagesInRoom: RoomMessages = 
				await this.chatMessageService.getAllMessagesFromRoom(lastJoinedRoom);
			for (let message of oldMessagesInRoom.messages){
				this.messageToClient(client.id, "message", message)
			}
		}
	  }
	  */
//	  emisorSocketIds.map(async socketId => {
//	  	  this.server.in(socketId).socketsJoin(privateRoomName)
//		  this.server.to(socketId).emit("listMyJoinedRooms", joinedRoomsByEmisor);
//	  	  await this.joinUserToRoom(socketId, nick, privateRoomName, undefined)
//	  });

//	  destinationSocketIds.map(async socketId => {
//	  	  this.server.in(socketId).socketsJoin(privateRoomName)
//		  this.server.to(socketId).emit("listMyJoinedRooms", joinedRoomsByDestination);
//	  	  await this.joinUserToRoom(socketId, destinationNick, privateRoomName, undefined)
//	  });

//	  await this.joinUserToRoom(client.id, nick, privateRoomName, undefined)
	  /*
	  const roomExists: boolean = await this.chatService.isRoomCreated(privateRoomName);
	  const emisorSocketIds = this.getClientSocketIdsFromNick(nick);
	  const destinationSocketIds = this.getClientSocketIdsFromNick(destinationNick);
	  if (!roomExists){
	  	  //join emisor
	  	  await this.createNewRoomAndJoin(client, nick, privateRoomName, undefined)
	  	  //join the second user in db
	  	  await this.chatService.addUserToRoom(privateRoomName, destinationNick)
	  }
	 //join all socket ids of emisor and destination
	  const joinedRoomsByEmisor: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(nick);
	  const joinedRoomsByDestination: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(destinationNick);
	  emisorSocketIds.forEach(socketId => {
	  	  this.server.in(socketId).socketsJoin(privateRoomName)
		  this.server.to(socketId).emit("listMyJoinedRooms", joinedRoomsByEmisor);
	  });

	  destinationSocketIds.forEach(socketId => {
	  	  this.server.in(socketId).socketsJoin(privateRoomName)
		  this.server.to(socketId).emit("listMyJoinedRooms", joinedRoomsByDestination);
	  });

//	  console.log(payload.message)
*/
   	  const messagePayload: ChatMessage = {
    	room: privateRoomName,
    	message: payload.message,
    	nick: nick,
    	date: new Date()
      }
	  await this.handleMessage(client, messagePayload)
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
