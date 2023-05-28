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
import { ChatMessage } from '@shared/types';
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
  private chatService: ChatService;

  @Inject(HashService)
  private hashService: HashService;

  constructor(name: string){
	this.gatewayName = name;
	this.logger = new Logger(this.gatewayName);
	this.users = new Map();
	this.rooms = new Set();
  }

  afterInit(): void {
	this.chatService.emptyTableRoom()
		.then(this.logger.log(this.gatewayName + ' initialized'));
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

  destroyEmptyRooms() {
	const activeRooms: Array<string> = this.getActiveRooms();

	[...this.rooms].forEach(async x=>{
		if (!activeRooms.includes(x)){
			this.rooms.delete(x);
			await this.chatService.deleteRoom(x);
		}
	});
  }

  handleDisconnect(socket: Socket): void {
	this.logger.log(`Socket client disconnected: ${socket.id}`)
	this.users.delete(socket.id);
	this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
    this.emit('listRooms', this.getActiveRooms());
    this.destroyEmptyRooms();
  }

  getActiveRooms(): Array<string>{
    const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;

	if (roomsRaw){
		return (Array.from(roomsRaw.keys()).filter(x => x[0] == '#') as Array<string>);
	}
	return ([]);
  }

  getUsersFromRoom(room: string): Array<ChatUser>{
   	const adapter: any = this.server.adapter;
	const roomsRaw: any = adapter.rooms;
	const usersRaw: Array<string> = Array.from(roomsRaw.get(room));
	let usersWithCompleteData: Array<ChatUser> = new Array();
	usersRaw.forEach(x => {
		usersWithCompleteData.push(this.users.get(x));
	});
    return (usersWithCompleteData);
  }

  isUserInRoom(room: string, clientSocketId: string): boolean {
	const allUsersInRoom: Array<ChatUser> = this.getUsersFromRoom(room);
	for (const user of allUsersInRoom)
	{
		if (user.client_id === clientSocketId){ 
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

  public async joinUserToRoom(clientSocketId: string, room: string, password: string | undefined): Promise<boolean>{
		//currently checking the existence of the room in the rooms Set

		//[process]
		// if the room doesn't exist:
		//   1. is created in socket.io
		//   2. is created in db
		//   3. user is added in socket.io
		// if the room exists:
		//   1. check if the user is currently joined. if it's, just continue
		//   2. (TBD!!) check if the user is banned from the channel
		//   3. check if the room is protected by password. if it's, compare password with stored hashpassword
	  	//		- match? join user 
	  	//		- doesn't match? return an error to the user
		//   

		const roomExists: boolean = this.rooms.has(room);

		if (!roomExists){
			await this
				.chatService
				.createRoom(room, password != undefined ? true : false, password);
			await this.rooms.add(room);
			await this.server.in(clientSocketId).socketsJoin(room);
			this.emit('listRooms', this.getActiveRooms());
			this.logger.log("User " + clientSocketId + "joined room " + room);
		}
		else if (roomExists && this.isUserInRoom(room, clientSocketId)){
			this.server.in(clientSocketId).socketsJoin(room);
		}
		else if (roomExists){
//			console.log("room already exists " + roomExists);
			const isRoomProtectedByPassword: boolean = await this 
				.chatService
				.isProtectedByPassword(room);

			if (isRoomProtectedByPassword && password === undefined ){
				console.log("no password provided");
				return false;
			}
			else if (isRoomProtectedByPassword){
				const isValidPassword: boolean = await this.hashService.comparePassword(password, await this.chatService.getHashPassFromRoom(room));
				if (!isValidPassword){
					console.error("invalid password");
					return false;
				}
				else{
//					console.log("password is correct");
					this.server.in(clientSocketId).socketsJoin(room);
					this.logger.log("User " + clientSocketId + "joined room " + room);
				}
			}
			else{
//				console.log("room isn't protected");
				this.server.in(clientSocketId).socketsJoin(room);
			}
		}
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
