import { 
	OnGatewayInit, 
	OnGatewayConnection, 
	WebSocketServer,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { Logger, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { HashService } from '../hash/hash.service';
import { RoomService } from '../chat/room/room.service';
import { UserService} from '../user/user.service';
import { ChatMessage, SocketPayload, RoomMetaData } from '@shared/types';
import { generateSocketErrorResponse, generateSocketInformationResponse } from '@shared/functions';
import { events, values } from '@shared/const';
import { ChatUser } from '@shared/types';
import { map } from 'rxjs/operators';
import {User} from '../user/user.entity'
import {UserStatus} from '@shared/enum'
import { PongService } from 'src/pong/pong.service';
//this base class is used to log the initialization
//and avoid code duplications in the gateways
@Injectable()
export class BaseGateway implements OnGatewayInit, OnGatewayDisconnect {

  @WebSocketServer() server: Server = new Server<any>();

  logger; 
  gatewayName: string;
//  users: Map<string, ChatUser>;
  rooms: Set<string>;

  @Inject(AuthService)
  private authService: AuthService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(forwardRef(() => ChatService))
  protected chatService: ChatService;

  @Inject(HashService)
  private hashService: HashService;

  @Inject(RoomService)
  protected roomService: RoomService;

  @Inject(UserService)
  protected userService: UserService;
  
  @Inject(forwardRef(() => PongService))
  protected pongservice:PongService;

  constructor(){
	this.rooms = new Set<string>();
  }

  afterInit(): void{
	this.chatService.getUsersObservable().subscribe(trigger=> {
		this.emitUpdateUsersAndRoomsMetadata()
	}
	)

//	const allRoomsInDb: string[] = await this.chatService.getAllRooms();
//	allRoomsInDb.map(x => this.rooms.add(x));
  }
 
  emitUpdateUsersAndRoomsMetadata() {
      	const activeUsersInServer: Array<ChatUser> = this
      		.getActiveUsersInServer()

			console.log("sending")
			console.log(activeUsersInServer)
		this.server.emit(events.ActiveUsers, activeUsersInServer)
		this.roomService.getAllRoomsMetaData()
			.then(r =>  this.server.emit(events.ListAllRooms, r))

		this.getAllChatUsersWithNickEquivalence()
			.then(c => this.server.emit(events.LoginNickEquivalence, c))
  }

  // about auth during client connection
  // https://github.com/ThomasOliver545/realtime-todo-task-management-app-nestjs-and-angular/blob/main/todo-api/src/todo/gateway/todo.gateway.ts
  async handleConnection(socket: Socket): Promise<void>{

    const isUserVerified = await this.authService.verifyJwt(socket.handshake.auth.token);
	if (isUserVerified){
		const login = this.authService.getLoginFromJwt(socket.handshake.auth.token)
		const user: User = await this.userService.getUserByLogin(login)
  	    const isHardConnect: boolean = this.getClientSocketIdsFromLogin(login).length > 0 ? false : true
		this.setLogin(socket);
		this.logger.log(`Socket client connected: ${socket.id}`)
		this.chatService.addChatUser(socket.id, new ChatUser(
			 socket.id,
			 this.authService.getIdFromJwt(socket.handshake.auth.token),
			 login,
			 user.nick,
			 UserStatus.ONLINE
		)
		);
		this.logger.log(this.getNumberOfConnectedUsers() + " users connected")

		const loginNickEquivalence: Array<any> = await this.
			getAllChatUsersWithNickEquivalence()
		this.server.emit(events.LoginNickEquivalence, loginNickEquivalence)
      	const activeUsersInServer: Array<ChatUser> = this
      		.getActiveUsersInServer()
		this.server.emit(events.ActiveUsers, activeUsersInServer)
		this.sendBlockedUsers(login)
	}
	else{
		//disconnect
		return this.disconnect(socket);
	}

  }

  // if the provided token is valid, we take the nick from the decoded jwt. 
  // by placing the nick in the handshake, the value remains during the whole connection
  // between server and client
  setLogin(socket: Socket): void{
		const decodedToken: JwtPayload = this.jwtService.decode(socket.handshake.auth.token) as JwtPayload;
		socket.handshake.query.login = decodedToken.login;

  }

  async removeUserFromRoom(room: string, login: string): Promise<boolean> {
  	  //updating relationships and entities in db
  	  const result: boolean = await this.chatService.removeUserFromRoom(room, login)
  	  if (result){
	    const socketIdsByLogin: Array<string> = this.getClientSocketIdsFromLogin(login);
  	  	//unsubscribe user from socket service
  	  	for (const clientId of socketIdsByLogin){
	    	this.server.in(clientId).socketsLeave(room);
	    }
	    //removing empty rooms
  	  	await this.destroyEmptyRooms(room);
  	  	return true;
  	  }
  	  return false;
  }

  //find all rooms whith 0 users in db and delete them
  async destroyEmptyRooms(room: string): Promise<void> {
	if (await this.chatService.isRoomEmpty(room)){
		this.rooms.delete(room);
		await this.chatService.deleteRoom(room);
	}
    this.emit(events.ListAllRooms, await this.roomService.getAllRoomsMetaData());
    this.emit(events.AllRoomsMetaData, await this.roomService.getAllRoomsMetaData());
  }

  async handleDisconnect(socket: Socket): Promise<void> {
		if (!socket) return;
		//const user = this.user.get(socket.id)
		const login: string = this.chatService.getChatUserBySocketId(socket.id)?.login;
		if (!login) return;
  	  //const login: string = user.login
		this.logger.log(`Socket client disconnected: ${socket.id}`)
	  this.chatService.deleteChatUserBySocketId(socket.id)
	  this.logger.log(this.getNumberOfConnectedUsers() + " users connected")

  	  //check if all clients of same login has been disconnected or not
  	  const isHardDisconnect: boolean = this.getClientSocketIdsFromLogin(login).length > 0 ? false : true
  	  if (isHardDisconnect){
		  const allJoinedRoomsByUser: Array<string> = await this.chatService
		  	  .getAllJoinedRoomsByOneUser(login);
      	  const activeUsersInServer: Array<ChatUser> = this
      		.getActiveUsersInServer()
		  this.server.emit(events.ActiveUsers, activeUsersInServer)	
		  for (let room of allJoinedRoomsByUser){
	  		  let roomMetaData: RoomMetaData = await this.roomService
	  		    .getRoomMetaData(room)
	  		  	this.broadCastToRoom(events.RoomMetaData, roomMetaData);
		  }
		  //cancel all match proposals
		  this.pongservice.cancelMatchProposal(login)
			
  	  }
	}

  //socket rooms, not db rooms
  //all rooms are created in db, but not necessarily in the socket server
  getActiveRooms(): Array<string>{
    const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;

	if (roomsRaw){
//		console.log(roomsRaw)
		return (Array.from(roomsRaw.keys()).filter(x => x[0] == '#') as Array<string>);
	}
	return ([]);
  }

  getActiveUsersInServer(): Array<ChatUser>{
	const clientsIterator = this.chatService.getAllChatUsers().entries();
	let activeUsers: Array<ChatUser> = []	
	let connectedClient = clientsIterator.next()
	let activeLogins = new Set()
	while (!connectedClient.done){
		const activeUser = connectedClient.value[1]
		activeLogins.add(activeUser.login)
		activeUsers.push(activeUser)
		connectedClient = clientsIterator.next()
	}
	let activeUsersUnique: Array<ChatUser> = []
	for (let user of activeUsers){
		if (activeLogins.has(user.login)){
			activeUsersUnique.push(user)
			activeLogins.delete(user.login)
		}
	}
	return activeUsersUnique
  }

  async getAllChatUsersWithNickEquivalence(): Promise<Array<any>>{
  	  const user: User[] = await this.userService.getAllUsers()
  	  const allUsers: Array<any> = user.map(u=> {
		 const eq = {login: u.login, nick: u.nick}
		 return eq
  	  })
	  return allUsers
  }

  getActiveLoginsInServer(): Array<string>{
	const clientsIterator = this.chatService.getAllChatUsers().entries();
	let logins: Array<string> = []	
	let connectedClient = clientsIterator.next()
	while (!connectedClient.done){
		logins.push(connectedClient.value[1].login)
		connectedClient = clientsIterator.next()
	}
	return [...new Set(logins)];
  }

  async getActiveWebAdminsInServer(): Promise<Array<ChatUser>>{
		const activeWebAdminsInServer: Array<string> = (await Promise.all(this
			.getActiveLoginsInServer()
			.map(async u => {
				const isWebAdmin = await this.userService.hasAdminPrivileges(u)
				if (isWebAdmin) return u;
			})))
			.filter(u => u !== undefined)
			//console.log(activeWebAdminsInServer)


		const usersArray = Array.from(this.chatService.getAllChatUsers());
		const usersWithCompleteData: Array<ChatUser> = 
			usersArray
				.filter(([clientId, chatUser]) => activeWebAdminsInServer.includes(chatUser.login))
  				.map(([_, chatUser]) => chatUser);
	    return (usersWithCompleteData);
  }

  //getting the currently connected users
  getActiveUsersInRoom(room: string): Array<ChatUser>{
   	const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;
	const roomIds = roomsRaw.get(room)

	if (!roomIds) return [];
	const usersRaw: Array<string> = Array.from(roomIds);
	//console.log("users raw")
	//onsole.log(usersRaw)
	let usersWithCompleteData: Array<ChatUser> = new Array();
	usersRaw.forEach(x => {
		usersWithCompleteData.push(this.chatService.getAllChatUsers().get(x));
	});
	//console.log(usersWithCompleteData)
    return (usersWithCompleteData);
  }

  getClientSocketIdsFromLogin(login: string): Array<string>{
	if (!login) return;
	const clientsIterator = this.chatService.getAllChatUsers().entries();
	const clientSocketIds = []

	let connectedClient = clientsIterator.next()
	while (!connectedClient.done){
		if (connectedClient.value[1].login === login){
			clientSocketIds.push(connectedClient.value[0])
		}
		connectedClient = clientsIterator.next()
	}
	return clientSocketIds;
  }
  
  async isUserInRoom(room: string, clientLogin: string): Promise<boolean> {
	const allUsersInRoom: Array<string> = await this.chatService.getAllUsersInRoom(room);

	for (const login of allUsersInRoom)
	{
		if (login === clientLogin){ 
			return (true);
		}
	}
	return (false);
  }

  private disconnect(socket: Socket) {
    socket.disconnect();
  }

  //emit to all connected users in this namespace
  public emit(event: string, data: any): void {
  	  this.server.emit(event, data);
  }

  public async createNewRoomAndJoin(clientId: string, creatorLogin: string, room: string, password: string | undefined): Promise<boolean>{
		const hasPass:boolean = password != undefined ? true : false;
		await this
			.chatService
			.createRoom(creatorLogin, room, hasPass, password);
		await this.rooms.add(room);
		await this.server.in(clientId).socketsJoin(room);
		const successfulJoin: boolean = await this.chatService.addUserToRoom(room, creatorLogin);
		if (!successfulJoin) return false;
		const allRoomsMetadata = await this.roomService.getAllRoomsMetaData()
		this.emit(events.AllRoomsMetaData, allRoomsMetadata);
		this.emit(events.ListAllRooms, allRoomsMetadata);
		this.logger.log("User " + clientId + "joined room " + room);
		return true
  }

  public async joinUserToRoom(clientId: string, login: string, room: string, password: string | undefined): Promise<boolean>{
	    //different status of the user regarding a chat room:
	  	// 1. connected to a room:  member of a room and currently online (bd + socket active)
	  	// 2. member of a room but offline (only bd)
	    // 3. not member of a room

		//[process]
		// if the room doesn't exist in database (= hard join):
		//   1. it's created in socket.io
		//   2. it's created in db, associating the owner to the Room
		//   3. user is joined in socket.io and saved in db
	  	//
		// if the room exists in db (= soft join):
		//   1. check if the user is currently connected to the room. if it's, just continue. otherwise, follow the next steps
		//   2. check if the user is banned from the channel
		//   3. check if the room is protected by password. if it's, compare password with stored hashpassword
	  	//		- match? join user 
	  	//		- doesn't match? return an error to the user
		//   4. user is joined in socket.io and saved in db
		//   

		let hardJoin: boolean = true; //login wasn't in channel with other client
	  	const roomExists: boolean = await this.chatService.isRoomCreated(room);
		if (!roomExists){
			console.log("password + ", password)
			const successfulCreatedAndJoin: boolean = await this.createNewRoomAndJoin(clientId, login, room, password)
			if (!successfulCreatedAndJoin) return false;
		}
		else if (roomExists && !(await this.isUserInRoom(room, login))){
			const isRoomProtectedByPassword: boolean = await this
				.chatService
				.isProtectedByPassword(room);
			if (await this.chatService.isBannedOfRoom(login, room)){
		  	  	const err: ChatMessage = {
			  	   room: room,
			  	   message: `Error: you are banned from ${room}`,
			  	   login: "system",
			  	   date: new Date()
		      	}
		  	  	this.messageToClient(clientId, "system", err);
				return false;
			}
			else if (isRoomProtectedByPassword){
		  	  	const err: ChatMessage = {
			  	   room: room,
			  	   message: `Error: bad password provided for ${room}`,
			  	   login: "system-error",
			  	   date: new Date()
		      	}
				let passwordChallengePassed: boolean = false;
				if (password !== undefined){
					passwordChallengePassed = await this.hashService.comparePassword(password, await this.chatService.getHashPassFromRoom(room));
				}
				if (!passwordChallengePassed){
		  	  		this.messageToClient(clientId, "system-error", err);
					return false;
				}
			}

			const successfulJoin: boolean = await this.chatService.addUserToRoom(room, login);
			if (!successfulJoin) return false;

		}
		else hardJoin = false;

		this.logger.log("User " + clientId + "joined room " + room);
		//confirm join to all the connected clients with the same login 
	    const socketIdsByLogin = this.getClientSocketIdsFromLogin(login);
	    const joinedRoomsByLogin: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(login);
	    const privateRoomsByLogin: Array<string> = await this.chatService.getMyPrivateRooms(login);
	    if (socketIdsByLogin){
	  	socketIdsByLogin.forEach(socketId => {
	  	  this.server.in(socketId).socketsJoin(room)
		  this.server.to(socketId).emit(events.ListMyJoinedRooms, joinedRoomsByLogin);
		  this.server.to(socketId).emit(events.ListMyPrivateRooms, privateRoomsByLogin);
	  	});
	  	}

	  	//announce the rest of the channel a new user has joined
	  	if (hardJoin && !room.includes(':') && !room.includes('@')){
	  		const user: User = await this.userService.getUserByLogin(login)
	  		const socketInfo: SocketPayload = generateSocketInformationResponse(room, `user ${user.nick} has joined room ${room}`)
			this.broadCastToRoomExceptForSomeUsers(socketInfo.event, socketInfo.data, [login])
			const joinFeedback: SocketPayload = generateSocketInformationResponse(room, `You have joined ${room}`)
			this.server.to(clientId).emit("system", joinFeedback.data)
		}
		return true;
  }

  public broadCastToRoomExceptForSomeUsers(event: string, payload: ChatMessage, excludedUsers: Array<string>): void {
		const targetUsers: Array<ChatUser> = this
			.getActiveUsersInRoom(payload.room)
			.filter(u => !(excludedUsers.includes(u.login)))
		for (let i = 0; i < targetUsers.length; i++){
			this.messageToClient(targetUsers[i].client_id, event, payload)
		}
  }

  public broadCastToRoom(event: string, payload: any): void{
		const targetUsers: Array<ChatUser> = this
			.getActiveUsersInRoom(payload.room)
		for (let i = 0; i < targetUsers.length; i++){
			this.messageToClient(targetUsers[i].client_id, event, payload)
		}
  }

  public messageToClient(clientId: string, event: string, payload: ChatMessage): void{
	  this.server.to(clientId).emit(event, payload)

  }

  public getNumberOfConnectedUsers(): number{
	return this.chatService.getAllChatUsers().size;
  }

  public async sendBlockedUsers(login: string): Promise<void>{
  	  	const bannedUsers: User[] = await this.userService
  	  		.getBannedUsersByLogin(login)
	    const socketIdsByLogin: Array<string> = this.getClientSocketIdsFromLogin(login);
  	  	//unsubscribe user from socket service
  	  	for (const clientId of socketIdsByLogin){
  	  		//console.log(clientId)
  		  	if (bannedUsers && bannedUsers.length > 0) {
				const blockedUsersByLogin: Array<string> =  bannedUsers
				.map(m => m.login)
 				this.server.to(clientId).emit(events.BlockedUsers, blockedUsersByLogin) 
 			}
 			else if (bannedUsers && bannedUsers.length == 0){
 				this.server.to(clientId).emit(events.BlockedUsers, []) 
 			}
	    }
  }

  public async kickAndDisconnect(login: string): Promise<void> {
  	    const socketIds: Array<string> = this.getClientSocketIdsFromLogin(login)
		const sockets = await this.server.fetchSockets()
		for (const socket of sockets) {
			if (socketIds.includes(socket.id)){ 
				socket.disconnect(true); 
			}
		}
  }

  public async sendCancelMatchProposal(player1: string, player2: string){
	  	const targetSocketIds: Array<string> = this.getClientSocketIdsFromLogin(player2);
	  	const emisorSocketIds: Array<string> = this.getClientSocketIdsFromLogin(player1);
		if (targetSocketIds){
		for (let i = 0; i < targetSocketIds.length; i++){
			this.server.to(targetSocketIds[i]).emit("cancelMatchProposal", player1)
		}
		}
		if (emisorSocketIds){
		for (let i = 0; i < emisorSocketIds.length; i++){
			this.server.to(emisorSocketIds[i]).emit("cancelMatchProposal", player2)
		}
		}
  
  }

  public async sendCancelOnline(player1: string, player2: string){
	  	const targetSocketIds: Array<string> = this.getClientSocketIdsFromLogin(player2);
	  	const emisorSocketIds: Array<string> = this.getClientSocketIdsFromLogin(player1);
		if (targetSocketIds){
		for (let i = 0; i < targetSocketIds.length; i++){
			this.server.to(targetSocketIds[i]).emit("cancelOnline", player1)
		}
		}
		if (emisorSocketIds){
		for (let i = 0; i < emisorSocketIds.length; i++){
			this.server.to(emisorSocketIds[i]).emit("cancelOnline", player2)
		}
		}
  
  }
	

}
