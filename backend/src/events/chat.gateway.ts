import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload } from '@shared/types';
import { events } from '@shared/const';
import { generateSocketErrorResponse } from '@shared/functions';
import { generateJoinResponse } from '@shared/functions';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { RoomMessages, ChatUser } from '@shared/types';

//https://stackoverflow.com/questions/69435506/how-to-pass-a-dynamic-port-to-the-websockets-gateway-in-nestjs
@WebSocketGateway({ namespace: '/chat', cors: true } )
//extending BaseGateway to log the gateway creation in the terminal
export class ChatGateway extends BaseGateway {


	
  constructor(private userService: UserService, private chatMessageService: ChatMessageService) {
	super(ChatGateway.name);
  }

  //separate afterInit from the base class
  async afterInit(): Promise<void> {}

  async handlePrivateMessage(client:Socket, payload: ChatMessage){
	  const emisorNick: string = client.handshake.query.nick as string;
	  const destinationNick: string = payload.room.substr(1, payload.room.length - 1)
	  if (await this.userService
	  	  .isUserBannedFromUser(destinationNick, emisorNick)){
	  	  return this.messageToClient(client.id, "system", 
	  			generateSocketErrorResponse("", `You can't send a private message because you are banned from: ${destinationNick}`).data);
	  }
	  const realRoomName: string = await this.chatService.generatePrivateRoomName(emisorNick, destinationNick)

	  const emisorSocketIds = this.getClientSocketIdsFromNick(emisorNick);
	  const destinationSocketIds = this.getClientSocketIdsFromNick(destinationNick);
	  let emisorNickWithAt;
	  let destinationNickWithAt;
  	  if (emisorNick.length > 0 && emisorNick[0] != '@'){
  	  	emisorNickWithAt = '@' + emisorNick;
  	  }
  	  if (destinationNick.length > 0 && destinationNick[0] != '@'){
  	  	destinationNickWithAt = '@' + destinationNick;
  	  }
	  payload.room = destinationNickWithAt;
	  for (let i = 0; i < emisorSocketIds.length; i++){
		this.messageToClient(emisorSocketIds[i], "message", payload)	
	  }
	  payload.room = emisorNickWithAt;
	  for (let i = 0; i < destinationSocketIds.length; i++){
		this.messageToClient(destinationSocketIds[i], "message", payload)	
	  }
	  payload.room = realRoomName;
	  await this.chatMessageService.saveMessage(payload)
  }

  //return object has two elements:
  // - event: type of event that the client will be listening to
  // - data: the content
  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> { 
	const nick: string = client.handshake.query.nick as string;
   	payload.nick = client.handshake.query.nick as string;
	if (payload.room.length > 0 && payload.room[0] === '@'){
		this.handlePrivateMessage(client, payload)
	}
	else if (await this.chatService.isUserInRoom(payload.room, nick)){

		//check if user is banned from the channel
		//////

		const bannedUsersBySender: Array<string> = 
			(await this
			.userService
			.getBannedUsersByNick(nick))
			.map(m => m.nick)
		//send message only to non-banned users
		const activeUsersInRoom: Array<ChatUser> = this
			.getActiveUsersInRoom(payload.room)
			.filter(u => !(bannedUsersBySender.includes(u.nick)))
		for (let i = 0; i < activeUsersInRoom.length; i++){
			this.messageToClient(activeUsersInRoom[i].client_id, "message", payload)
		}

		//this.broadCastToRoom('message', payload);
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

  async joinRoutine(clientSocketId: string, nick: string, room: string, pass: string, typeOfJoin: string){
  	  const originalRoom = room;
  	  if (room.length > 0 && room[0] == '@'){
	  	  if (await this.userService
	  			  .isUserBannedFromUser(room.substr(1, room.length - 1), nick)){
	  			  return this.messageToClient(clientSocketId, "system", 
	  					generateSocketErrorResponse("", `You can't open a private conversation with ${room.substr(1, room.length - 1)} because you are banned`).data);
	      }
		  room = await this.chatService.generatePrivateRoomName(nick, room.substr(1, room.length - 1))
  	  }

	  const wasUserAlreadyActiveInRoom: boolean = await this.isUserAlreadyActiveInRoom(clientSocketId, room);
	  const successfulJoin = await 
	  		this.joinUserToRoom(clientSocketId, nick, room, pass);

	  if (successfulJoin){
	  	const response: ChatMessage = generateJoinResponse(originalRoom);
		this.messageToClient(clientSocketId, typeOfJoin, response);

		//sending old messages of the room, except for those of users that banned
		//the new user trying to join
		if (!wasUserAlreadyActiveInRoom){
			let oldMessagesInRoom: RoomMessages = 
				await this.chatMessageService.getAllMessagesFromRoom(room);

			//get all u2u bans to 'nick'
			//on every message, check the nick of the sender, if it's one of
			//the users that have banned the one trying to join,
			//the message isn't send
			const usersThatHaveBanned: Array<string> = (await this.userService.getUsersThatHaveBannedAnother(nick)).map(u => u.nick)

			//using originalRoom is a way to handle the names of private rooms:
			//in db are #2-8, for instance, but we send @nick to the client as 
			//a room name
			if (originalRoom !== room){
				oldMessagesInRoom.name = originalRoom
				oldMessagesInRoom.messages.map(m => m.room = originalRoom)
			}
			for (let message of oldMessagesInRoom.messages){
				if (!usersThatHaveBanned.includes(message.nick)){
					this.messageToClient(clientSocketId, "message", message)
				}
			}
		}
	  }
  }

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


  //in case it arrives different rooms separated by comma,
  // the rooms param is splitted
  //the command allows this structure: /join [#]channel [pass with spaces allowed]
  @SubscribeMessage('join')
  async handleJoinRoom(client: Socket, roomAndPassword: string): Promise<void>{
	  const splittedRooms: Array<string> = roomAndPassword.split(" ", 1)[0].split(",");
	  let room: string = roomAndPassword.split(" ", 2)[0];
	  const pass: string | undefined = roomAndPassword.split(" ", 2)[1];
	  const adapter: any = this.server.adapter;
	  const roomsRaw: any = adapter.rooms;
	  const nick: string = client.handshake.query.nick as string;

  	  if (room.length > 0 && room[0] != '#' && room[0] != '@'){
  	  	room = '#' + room;
  	  }
  	  //check if user is banned from channel

  	  await this.joinRoutine(client.id, nick, room, pass, "join")
  }

  ////////////////////////////
  // 	PRIVATE MESSAGES 	//
  ////////////////////////////

  // - private messages are supported by common channels which only
  // allows 2 users
  // - the name of that room is defined by the id of the 2 users, for instance:
  // id 4 wants to send a private message to id 2, the name of the channel
  // will be "#2-4", both ids, sorted asc, separated by a -
  //
  // [process]:
  //	1. [tbd] check if the user is banned by the other user
  //	2. joins the first message emisor to the room (following the same process as a normal join)
  //	3. destination user is forced to join the room (as a normal join but on behind)
  //	4. send the message to the channel

  @SubscribeMessage('mp')
  async mp(client: Socket, payload: ChatMessage): Promise<void> {
	  const nick: string = client.handshake.query.nick as string;
	  let destinationNick: string = payload.room;
	  const destinationUser = await this.userService.getUserByNick(destinationNick);
	  if (!destinationUser)
	  	  return generateSocketErrorResponse("", `User not found: ${destinationNick}`);
	  if (await this.userService.isUserBannedFromUser(destinationNick, nick))
	  	  return generateSocketErrorResponse("", `You are banned from: ${destinationNick}`);
	  const privateRoomName: string = await this.chatService.generatePrivateRoomName(nick, destinationNick)
	  const emisorSocketIds = this.getClientSocketIdsFromNick(nick);
	  const destinationSocketIds = this.getClientSocketIdsFromNick(destinationNick);
	  let emisorNickWithAt;
	  let destinationNickWithAt;

  	  if (nick.length > 0 && nick[0] != '@'){
  	  	emisorNickWithAt = '@' + nick;
  	  }

  	  if (destinationNick.length > 0 && destinationNick[0] != '@'){
  	  	destinationNickWithAt = '@' + destinationNick;
  	  }

	  for (let i = 0; i < emisorSocketIds.length; i++){
  	  	await this.joinRoutine(emisorSocketIds[i], nick, destinationNickWithAt, undefined, "join")
	  }
	  for (let i = 0; i < destinationSocketIds.length; i++){
  	  	await this.joinRoutine(destinationSocketIds[i], destinationNick, emisorNickWithAt, undefined, "joinmp")
	  }

   	  const messagePayload: ChatMessage = {
    	room: destinationNickWithAt,
    	message: payload.message,
    	nick: nick,
    	date: new Date()
      }
	  await this.handleMessage(client, messagePayload)
  }

  @SubscribeMessage(events.ListAllRooms)
  async listRooms(client: Socket): Promise<WsResponse<unknown>>{
	  return { event: events.ListAllRooms, data: await this.chatService.getAllRooms()}
  }

  @SubscribeMessage(events.ListMyPrivateRooms)
  async listMyPrivateRooms(client: Socket): Promise<WsResponse<unknown>>{
	  const nick: string = client.handshake.query.nick as string;
	  return { event: events.ListMyPrivateRooms, data: await this.chatService.getMyPrivateRooms(nick)}
  }

  @SubscribeMessage(events.ListMyJoinedRooms)
  async listMyJoinedRooms(client: Socket): Promise<WsResponse<unknown>>{
	  const nick: string = client.handshake.query.nick as string;
	  return { event: events.ListMyJoinedRooms, data: await this.chatService.getAllJoinedRoomsByOneUser(nick)}
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

  @SubscribeMessage('banuser')
  async banUser2User(client: Socket, payload: ChatMessage){
	  const nick: string = client.handshake.query.nick as string;
	  this.chatService.banUser2User(nick, payload.room)
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
