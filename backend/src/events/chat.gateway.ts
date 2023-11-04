import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload, RoomMetaData } from '@shared/types';
import { events, values } from '@shared/const';
import { generateSocketErrorResponse, generateSocketInformationResponse } from '@shared/functions';
import { generateJoinResponse } from '@shared/functions';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { User } from '../user/user.entity';
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

  async handlePrivateMessage(client:Socket, payload: ChatMessage){
	  const emisorLogin: string = client.handshake.query.login as string;
	  const destinationLogin: string = payload.room.substr(1, payload.room.length - 1)
	  if (await this.userService
	  	  .isUserBannedFromUser(destinationLogin, emisorLogin)){
	  	  return this.messageToClient(client.id, "system", 
	  			generateSocketErrorResponse("", `You can't send a private message because you are banned from: ${destinationLogin}`).data);
	  }
	  const realRoomName: string = await this.chatService.generatePrivateRoomName(emisorLogin, destinationLogin)

	  const emisorSocketIds = this.getClientSocketIdsFromLogin(emisorLogin);
	  const destinationSocketIds = this.getClientSocketIdsFromLogin(destinationLogin);
	  let emisorLoginWithAt;
	  let destinationLoginWithAt;
  	  if (emisorLogin.length > 0 && emisorLogin[0] != '@'){
  	  	emisorLoginWithAt = '@' + emisorLogin;
  	  }
  	  if (destinationLogin.length > 0 && destinationLogin[0] != '@'){
  	  	destinationLoginWithAt = '@' + destinationLogin;
  	  }
	  payload.room = destinationLoginWithAt;
	  for (let i = 0; i < emisorSocketIds.length; i++){
		this.messageToClient(emisorSocketIds[i], "message", payload)	
	  }
	  payload.room = emisorLoginWithAt;
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
	const login: string = client.handshake.query.login as string;
   	payload.login = client.handshake.query.login as string;
	if (payload.room.length > 0 && payload.room[0] === '@'){
		this.handlePrivateMessage(client, payload)
	}
	else if (await this.chatService.isUserInRoom(payload.room, login)){

		//check if user is banned from the channel
		const isBannedOfRoom: boolean = await this
			.chatService
			.isBannedOfRoom(login, payload.room)
		if (isBannedOfRoom)	{
			return this.messageToClient(client.id, "system",
				generateSocketErrorResponse("", `You can't send a message to channel ${payload.room} because you are banned`).data);
		}

		//send message only to non-banned users
		const bannedUsersBySender: Array<string> = 
			(await this
			.userService
			.getBannedUsersByLogin(login))
			.map(m => m.login)
		const activeUsersInRoom: Array<ChatUser> = this
			.getActiveUsersInRoom(payload.room)
			.filter(u => !(bannedUsersBySender.includes(u.login)))
		for (let i = 0; i < activeUsersInRoom.length; i++){
			this.messageToClient(activeUsersInRoom[i].client_id, "message", payload)
		}

		await this.chatMessageService.saveMessage(payload)
	} 
  }

  //return a response directly to the client
  @SubscribeMessage('help')
  handleHelp(client: Socket, payload: ChatMessage): WsResponse<unknown>{
	const response: ChatMessage = {
		room: payload.room,
		message: "help response",
		login: "system",
		date: new Date()
	}
	return { event: 'system', data: response};
  }

  async joinRoutine(clientSocketId: string, login: string, room: string, pass: string, typeOfJoin: string){
  	  const originalRoom = room;
  	  if (room.length > 0 && room[0] == '@'){
	  	  if (await this.userService
	  			  .isUserBannedFromUser(room.substr(1, room.length - 1), login)){
	  			  return this.messageToClient(clientSocketId, "system-error", 
	  					generateSocketErrorResponse("", `You can't open a private conversation with ${room.substr(1, room.length - 1)} because you are banned`).data);
	      }
		  room = await this.chatService.generatePrivateRoomName(login, room.substr(1, room.length - 1))
		  if (!room){
			  return this.messageToClient(clientSocketId, "system-error",
	  		  	  generateSocketErrorResponse("", `Bad channel name`).data);
	  	  }
  	  }

	  const wasUserAlreadyActiveInRoom: boolean = await this.isUserAlreadyActiveInRoom(clientSocketId, room);
	  const successfulJoin = await 
	  		this.joinUserToRoom(clientSocketId, login, room, pass);

	  if (successfulJoin){
	  	const response: ChatMessage = generateJoinResponse(originalRoom);
		this.messageToClient(clientSocketId, typeOfJoin, response);

		//update metadata to all users of the room
		let roomMetaData: RoomMetaData = await this.roomService
			.getRoomMetaData(room)
	  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);

		//sending old messages of the room, except for those of users that banned
		//the new user trying to join
		if (!wasUserAlreadyActiveInRoom){
			let oldMessagesInRoom: RoomMessages = 
				await this.chatMessageService.getAllMessagesFromRoom(room);

			//get all u2u bans to 'login'
			//on every message, check the login of the sender, if it's one of
			//the users that have banned the one trying to join,
			//the message isn't send
			const usersThatHaveBanned: Array<string> = (await this.userService.getUsersThatHaveBannedAnother(login)).map(u => u.login)

			//using originalRoom is a way to handle the names of private rooms:
			//in db are #2-8, for instance, but we send @login to the client as 
			//a room name
			if (originalRoom !== room){
				oldMessagesInRoom.name = originalRoom
				oldMessagesInRoom.messages.map(m => m.room = originalRoom)
			}
			for (let message of oldMessagesInRoom.messages){
				if (!usersThatHaveBanned.includes(message.login)){
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
	  let room: string = roomAndPassword.split(" ", 2)[0];
	  const pass: string | undefined = roomAndPassword.split(" ", 2)[1];
	  const login: string = client.handshake.query.login as string;

  	  if (room.length > 0 && room[0] != '#' && room[0] != '@'){
  	  	room = '#' + room;
  	  }
	  for (const c of values.forbiddenChatRoomCharacters){
		if (room.substr(1, room.length - 1).includes(c)){
			this.server.to(client.id)
				.emit("system", generateSocketErrorResponse(room, 
					`Invalid name for the channel ${room}, try other`).data)
			return ;
		}
	  }

  	  //check if user is banned from channel
  	  await this.joinRoutine(client.id, login, room, pass, "join")
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
	  const login: string = client.handshake.query.login as string;
	  let destinationLogin: string = payload.room;
	  const destinationUser = await this.userService.getUserByLogin(destinationLogin);
	  if (!destinationUser)
	  	  return generateSocketErrorResponse("", `User not found: ${destinationLogin}`);
	  if (await this.userService.isUserBannedFromUser(destinationLogin, login))
	  	  return generateSocketErrorResponse("", `You are banned from: ${destinationLogin}`);
	  const privateRoomName: string = await this.chatService.generatePrivateRoomName(login, destinationLogin)
	  const emisorSocketIds = this.getClientSocketIdsFromLogin(login);
	  const destinationSocketIds = this.getClientSocketIdsFromLogin(destinationLogin);
	  let emisorLoginWithAt;
	  let destinationLoginWithAt;

  	  if (login.length > 0 && login[0] != '@'){
  	  	emisorLoginWithAt = '@' + login;
  	  }

  	  if (destinationLogin.length > 0 && destinationLogin[0] != '@'){
  	  	destinationLoginWithAt = '@' + destinationLogin;
  	  }

	  for (let i = 0; i < emisorSocketIds.length; i++){
  	  	await this.joinRoutine(emisorSocketIds[i], login, destinationLoginWithAt, undefined, "join")
	  }
	  for (let i = 0; i < destinationSocketIds.length; i++){
  	  	await this.joinRoutine(destinationSocketIds[i], destinationLogin, emisorLoginWithAt, undefined, "joinmp")
	  }

   	  const messagePayload: ChatMessage = {
    	room: destinationLoginWithAt,
    	message: payload.message,
    	login: login,
    	date: new Date()
      }
	  await this.handleMessage(client, messagePayload)
  }

  @SubscribeMessage(events.ListAllRooms)
  async listRooms(client: Socket): Promise<WsResponse<unknown>>{
	  return { event: events.ListAllRooms, data: await this.roomService.getAllRoomsMetaData()}
  }

  @SubscribeMessage(events.ListMyPrivateRooms)
  async listMyPrivateRooms(client: Socket): Promise<WsResponse<unknown>>{
	  const login: string = client.handshake.query.login as string;
	  return { event: events.ListMyPrivateRooms, data: await this.chatService.getMyPrivateRooms(login)}
  }

  @SubscribeMessage(events.ListMyJoinedRooms)
  async listMyJoinedRooms(client: Socket): Promise<WsResponse<unknown>>{
	  const login: string = client.handshake.query.login as string;
	  return { event: events.ListMyJoinedRooms, data: await this.chatService.getAllJoinedRoomsByOneUser(login)}
  }

  @SubscribeMessage('admin')
  async makeRoomAdmin(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const adminOk: boolean = await this.chatService.makeRoomAdmin(login, payload.login, payload.room);
	  if (adminOk){
	    const roomInfo: SocketPayload = generateSocketInformationResponse(payload.room, `user ${payload.login} is now admin of room ${payload.room}`)
	  	this.broadCastToRoom(roomInfo.event, roomInfo.data)
		let roomMetaData: RoomMetaData = await this.roomService
			.getRoomMetaData(payload.room)
	  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);
	  }
  }

  @SubscribeMessage('noadmin')
  async removeRoomAdmin(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const adminRemoved: boolean = await this.chatService.removeRoomAdmin(login, payload.login, payload.room);
	  console.log(adminRemoved)
	  if (adminRemoved){
	    const roomInfo: SocketPayload = generateSocketInformationResponse(payload.room, `user ${payload.login} isn't admin of room ${payload.room} anymore`)
	  	this.broadCastToRoom(roomInfo.event, roomInfo.data)
		let roomMetaData: RoomMetaData = await this.roomService
			.getRoomMetaData(payload.room)
	  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);
	  }
  } 

  @SubscribeMessage(events.Pass)
  async addPassToRoom(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  this.chatService.addPassToRoom(login, payload.room, payload.message);
  }

  @SubscribeMessage(events.RemovePass)
  async removePassOfRoom(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  this.chatService.removePassOfRoom(login, payload.room);
  }


  @SubscribeMessage('ban')
  async banUserOfRoom(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const activeUsersInRoom: Array<ChatUser> = this.getActiveUsersInRoom(payload.room);
	  const banOk: boolean = await this
	  	.chatService
	  	.banUserOfRoom(login, payload.login, payload.room);
	  if (banOk){
	  	const targetSocketIds: Array<string> = this.getClientSocketIdsFromLogin(payload.login);
	  	if (targetSocketIds.length){

			const err: SocketPayload = generateSocketInformationResponse(payload.room, 
				`Information: you have been banned from ${payload.room}`)
			console.log(err.data)

			for (let i = 0; i < targetSocketIds.length; i++){
				this.server.to(targetSocketIds[i]).emit("system", err.data)
				this.server.to(targetSocketIds[i])
					.emit("listMyJoinedRooms", await this.chatService.getAllJoinedRoomsByOneUser(payload.login));
			}
		}
		this.server.to(client.id)
			.emit("system", generateSocketInformationResponse(payload.room, 
				`You've banned ${payload.login} in ${payload.room} successfully`).data)
	    const banInfo: SocketPayload = generateSocketInformationResponse(payload.room, `user ${payload.login} has been banned of ${payload.room}`)
		let roomMetaData: RoomMetaData = await this.roomService
			.getRoomMetaData(payload.room)
	  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);
	  	this.broadCastToRoomExceptForSomeUsers(banInfo.event, banInfo.data, [payload.login, login])

  	  }
  }

  @SubscribeMessage('noban')
  async removeBanOfRoom(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const banRemoved: boolean = await this.chatService.removeBanOfRoom(login, payload.login, payload.room);
	  if (banRemoved){
		this.server.to(client.id)
			.emit("system", generateSocketInformationResponse(payload.room, 
				`You've removed the ban of ${payload.login} in ${payload.room} successfully`).data)
		let roomMetaData: RoomMetaData = await this.roomService
			.getRoomMetaData(payload.room)
	  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);
	  }
  }

  @SubscribeMessage('banuser')
  async banUser2User(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const banOk: boolean = await this.chatService.banUser2User(login, payload.room)
	  if (banOk){
		this.server.to(client.id)
			.emit("system", generateSocketInformationResponse(payload.room, 
				`You've banned ${payload.room} successfully`).data)
		this.sendBlockedUsers(client.id, login)
	  }
  }

  @SubscribeMessage('nobanuser')
  async nobanUser2User(client: Socket, payload: ChatMessage){
	  const login: string = client.handshake.query.login as string;
	  const noBanOk: boolean = await this.chatService.noBanUser2User(login, payload.room)
	  if (noBanOk){
		this.server.to(client.id)
			.emit("system", generateSocketInformationResponse(payload.room, 
				`You've removed the ban of ${payload.room} successfully`).data)
		this.sendBlockedUsers(client.id, login)
	  }
  }

  //part == to leave a room
  @SubscribeMessage('part')
  async part(client: Socket, room: string): Promise<void>{
	const login: string = client.handshake.query.login as string;
	const socketIdsByLogin: Array<string> = this.getClientSocketIdsFromLogin(login);
	if (socketIdsByLogin.length === 0)
		return generateSocketErrorResponse(room, `Error`)
	const successfulPart: boolean = await this.removeUserFromRoom(room, login);
	if (successfulPart){
	    const joinedRoomsByLogin: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(login);
	    const privateRoomsByLogin: Array<string> = await this.chatService.getMyPrivateRooms(login);
	  	socketIdsByLogin.forEach(socketId => {
		  this.server.to(socketId).emit(events.ListMyJoinedRooms, joinedRoomsByLogin);
		  this.server.to(socketId).emit(events.ListMyPrivateRooms, privateRoomsByLogin);
		  this.server.to(socketId).emit("system", generateSocketInformationResponse(room, `you've left ${room}`).data);
	  	});

	 	const roomInfo: SocketPayload = generateSocketInformationResponse(room, `user ${login} has left room ${room}`)
	  	this.broadCastToRoom(roomInfo.event, roomInfo.data)
	}
	else{
		this.server.to(client.id)
			.emit("system", generateSocketErrorResponse(room, 
				`Error: maybe the room ${room} doesn't exist, or you aren't part of that room`).data)
	}
  }

  //used when the client changes the view and the chat component disappears.
  //this way we force the server to send the historial of each joined room
  //in case the component appears again in the client
  @SubscribeMessage(events.SoftDisconnect)
  softDisconnect(client: Socket): void{
  	  const activeRooms: Array<string> = this.getActiveRooms()
  	  for (const room of activeRooms){
		this.server.in(client.id).socketsLeave(room);
  	  }
  }
}
