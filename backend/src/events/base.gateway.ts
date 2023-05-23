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

  getActiveRooms(): Array<string> {
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

  private disconnect(socket: Socket) {
    socket.emit('Error', new UnauthorizedException());
    socket.disconnect();
  }

  //emit to all connected users in this namespace
  public emit(event: string, data: any): void {
  	  this.server.emit(event, data);
  }

  public joinUserToRoom(clientSocketId: string, room: string, password: string | undefined): void{
  	  console.log(password == "undefined" );
		this.chatService.createRoom(room, password != undefined ? true : false, password);
		this.server.in(clientSocketId).socketsJoin(room);
		this.rooms.add(room);
		this.logger.log("User " + clientSocketId + "joined room " + room);
  }

  public broadCastToRoom(event: string, payload: ChatMessage): void{
	  this.server.to(payload.room).emit(event, payload)
  }

  public getNumberOfConnectedUsers(): number{
	return this.users.size;
  }

}
