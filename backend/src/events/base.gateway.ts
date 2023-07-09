import { 
	OnGatewayInit, 
	OnGatewayConnection, 
	WebSocketServer,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { HashService } from '../hash/hash.service';
import { RoomService } from '../chat/room/room.service';
import { ChatMessage } from '@shared/types';
import { events } from '@shared/const';
import { ChatUser } from '@shared/types';
import { map } from 'rxjs/operators';

//this base class is used to log the initialization
//and avoid code duplications in the gateways
export class BaseGateway implements OnGatewayInit, OnGatewayDisconnect {

  @WebSocketServer() server: Server = new Server<any>();

  private readonly logger; 
  gatewayName: string;
  users: Map<string, ChatUser>;
  rooms: Set<string>;

  @Inject(AuthService)
  private authService: AuthService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ChatService)
  protected chatService: ChatService;

  @Inject(HashService)
  private hashService: HashService;

  @Inject(RoomService)
  private roomService: RoomService;

  constructor(name: string){
	this.gatewayName = name;
	this.logger = new Logger(this.gatewayName);
	this.users = new Map();
	this.rooms = new Set<string>();
  }

  async afterInit(): Promise<void>{
	const allRoomsInDb: string[] = await this.chatService.getAllRooms();
	allRoomsInDb.map(x => this.rooms.add(x));
  }
 
  // about auth during client connection
  // https://github.com/ThomasOliver545/realtime-todo-task-management-app-nestjs-and-angular/blob/main/todo-api/src/todo/gateway/todo.gateway.ts
  async handleConnection(socket: Socket): Promise<void>{

    const isUserVerified = await this.authService.verifyJwt(socket.handshake.auth.token);
 
	if (isUserVerified){
		this.setNick(socket);
		this.logger.log(`Socket client connected: ${socket.id}`)
		this.users.set(socket.id, new ChatUser(
			 socket.id,
			 this.authService.getIdFromJwt(socket.handshake.auth.token),
			 this.authService.getNickFromJwt(socket.handshake.auth.token))
		);
		this.emit('listAllRooms', await this.chatService.getAllRooms());
		this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
	}
	else{
		//disconnect
		return this.disconnect(socket);
	}

  }

  // if the provided token is valid, we take the nick from the decoded jwt. 
  // by placing the nick in the handshake, the value remains during the whole connection
  // between server and client
  setNick(socket: Socket): void{
		const decodedToken: JwtPayload = this.jwtService.decode(socket.handshake.auth.token) as JwtPayload;
		socket.handshake.query.nick = decodedToken.nick;

  }

  async removeUserFromRoom(clientId: string, room: string, nick: string): Promise<boolean> {
  	  //updating relationships and entities in db
  	  const result: boolean = await this.chatService.removeUserFromRoom(room, nick)

  	  if (result){
  	  	//unsubscribe user from socket service
	    this.server.in(clientId).socketsLeave(room);

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
    this.emit('listAllRooms', await this.chatService.getAllRooms());
  }


  async handleDisconnect(socket: Socket): Promise<void> {
	this.logger.log(`Socket client disconnected: ${socket.id}`)
	this.users.delete(socket.id);
	this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
//    this.emit('listRooms', await this.chatService.getAllRooms());
//    this.destroyEmptyRooms();
  }

  //socket rooms, not db rooms
  //all rooms are created in db, but not necessarily in the socket server
  getActiveRooms(): Array<string>{
    const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;

	if (roomsRaw){
		return (Array.from(roomsRaw.keys()).filter(x => x[0] == '#') as Array<string>);
	}
	return ([]);
  }

  //this is the old method to get the users from a room
  //I don't remove it yet because it could be useful for
  //getting the currently connected users
  getActiveUsersInRoom(room: string): Array<ChatUser>{
   	const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;
	const usersRaw: Array<string> = Array.from(roomsRaw.get(room));
	let usersWithCompleteData: Array<ChatUser> = new Array();
	usersRaw.forEach(x => {
		usersWithCompleteData.push(this.users.get(x));
	});
    return (usersWithCompleteData);
  }

  getClientSocketIdsFromNick(nick: string): Array<string>{
	const clientsIterator = this.users.entries();
	const clientSocketIds = []

	let connectedClient = clientsIterator.next()
	while (!connectedClient.done){
		if (connectedClient.value[1].nick === nick){
			clientSocketIds.push(connectedClient.value[0])
		}
		connectedClient = clientsIterator.next()
	}
	return clientSocketIds;
  }
  
  async isUserInRoom(room: string, clientNick: string): Promise<boolean> {
	const allUsersInRoom: Array<string> = await this.chatService.getAllUsersInRoom(room);

	for (const nick of allUsersInRoom)
	{
		if (nick === clientNick){ 
			return (true);
		}
	}
	return (false);
  }

  private disconnect(socket: Socket) {
    socket.emit('Error', new UnauthorizedException());
    socket.disconnect();
  }

  //emit to all connected users in this namespace
  public emit(event: string, data: any): void {
  	  this.server.emit(event, data);
  }

  public async createNewRoomAndJoin(clientId: string, creatorNick: string, room: string, password: string | undefined): Promise<boolean>{
		const hasPass:boolean = password != undefined ? true : false;
		await this
			.chatService
			.createRoom(creatorNick, room, hasPass, password);
		await this.rooms.add(room);
		await this.server.in(clientId).socketsJoin(room);
		const successfulJoin: boolean = await this.chatService.addUserToRoom(room, creatorNick);
		if (!successfulJoin) return false;
		this.emit('listAllRooms', await this.chatService.getAllRooms());
		this.logger.log("User " + clientId + "joined room " + room);
		return true
  }

  public async joinUserToRoom(clientId: string, nick: string, room: string, password: string | undefined): Promise<boolean>{
//  public async joinUserToRoom(client: Socket, room: string, password: string | undefined): Promise<boolean>{
		//currently checking the existence of the room in the rooms Set
	    //different status of the user regarding a chat room:
	  	// 1. connected to a room:  member of a room and currently online (bd + socket active)
	  	// 2. member of a room but offline (only bd)
	    // 3. not member of a room

		//[process]
		// if the room doesn't exist in database:
		//   1. it's created in socket.io
		//   2. it's created in db, associating the owner to the Room
		//   3. user is joined in socket.io and saved in db
	  	//
		// if the room exists in db:
		//   1. check if the user is currently connected to the room. if it's, just continue. otherwise, follow the next steps
		//   2. check if the user is banned from the channel
		//   3. check if the room is protected by password. if it's, compare password with stored hashpassword
	  	//		- match? join user 
	  	//		- doesn't match? return an error to the user
		//   4. user is joined in socket.io and saved in db
		//   

	  	const roomExists: boolean = await this.chatService.isRoomCreated(room);
		if (!roomExists){
			const successfulCreatedAndJoin: boolean = await this.createNewRoomAndJoin(clientId, nick, room, password)
			if (!successfulCreatedAndJoin) return false;
		}
		else if (roomExists && !(await this.isUserInRoom(room, nick))){
			const isRoomProtectedByPassword: boolean = await this
				.chatService
				.isProtectedByPassword(room);
			if (await this.chatService.isBannedOfRoom(nick, room)){
		  	  	const err: ChatMessage = {
			  	   room: room,
			  	   message: `Error: you are banned from ${room}`,
			  	   nick: "system",
			  	   date: new Date()
		      	}
		  	  	this.messageToClient(clientId, "system", err);
				return false;
			}
			else if (isRoomProtectedByPassword){
		  	  	const err: ChatMessage = {
			  	   room: room,
			  	   message: `Error: bad password provided for ${room}`,
			  	   nick: "system",
			  	   date: new Date()
		      	}
				let passwordChallengePassed: boolean = false;
				if (password !== undefined){
					passwordChallengePassed = await this.hashService.comparePassword(password, await this.chatService.getHashPassFromRoom(room));
				}
				if (!passwordChallengePassed){
		  	  		this.messageToClient(clientId, "system", err);
					return false;
				}
			}

			const successfulJoin: boolean = await this.chatService.addUserToRoom(room, nick);
			if (!successfulJoin) return false;
			this.logger.log("User " + clientId + "joined room " + room);
		}
	    const socketIdsByNick = this.getClientSocketIdsFromNick(nick);
	    const joinedRoomsByNick: Array<string> = await this.chatService.getAllJoinedRoomsByOneUser(nick);
	    const privateRoomsByNick: Array<string> = await this.chatService.getMyPrivateRooms(nick);
//	    console.log(socketIdsByNick)
	    console.log(joinedRoomsByNick)
	  	socketIdsByNick.forEach(socketId => {
	  	  this.server.in(socketId).socketsJoin(room)
		  this.server.to(socketId).emit(events.ListMyJoinedRooms, joinedRoomsByNick);
		  this.server.to(socketId).emit(events.ListMyPrivateRooms, privateRoomsByNick);
	  	});
		return true;
  }

  public broadCastToRoom(event: string, payload: ChatMessage): void{
	  this.server.to(payload.room).emit(event, payload)
  }

  public messageToClient(clientId: string, event: string, payload: ChatMessage): void{
	  this.server.to(clientId).emit(event, payload)
  }

  public getNumberOfConnectedUsers(): number{
	return this.users.size;
  }

}
