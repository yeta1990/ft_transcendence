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
import { ChatMessage } from '@shared/types';
import { map } from 'rxjs/operators';

//this base class is used to log the initialization
//and avoid code duplications in the gateways
export class BaseGateway implements OnGatewayInit, OnGatewayDisconnect {

  @WebSocketServer() server: Server = new Server<any>();

  private readonly logger; 
  gatewayName: string;
  users: string[] = [];
  activeRooms: string[] = ["default"];

  @Inject(AuthService)
  private authService: AuthService;

  @Inject(JwtService)
  private jwtService: JwtService;

  constructor(name: string){
	this.gatewayName = name;
	this.logger = new Logger(this.gatewayName);
  }

  afterInit(): void {
	this.logger.log(this.gatewayName + ' initialized');
  }

  // about auth during client connection
  // https://github.com/ThomasOliver545/realtime-todo-task-management-app-nestjs-and-angular/blob/main/todo-api/src/todo/gateway/todo.gateway.ts
  async handleConnection(socket: Socket): Promise<void>{

    const isUserVerified = await this.authService.verifyJwt(socket.handshake.auth.token);
 
	if (isUserVerified){
		this.setNick(socket);
		this.logger.log(`Socket client connected: ${socket.id}`)
		this.users.push(socket.id);
		this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
//		this.joinUserToRoom(socket.id, "default");
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

  handleDisconnect(socket: Socket): void {
	this.logger.log(`Socket client disconnected: ${socket.id}`)
	this.users = this.users.filter(e => e !== socket.id);
	this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
  }

  private disconnect(socket: Socket) {
    socket.emit('Error', new UnauthorizedException());
    socket.disconnect();
  }
  //emit to all connected users in this namespace
  public emit(event: string, data: any): void {
  	  this.server.emit(event, data);
  }

  public joinUserToRoom(clientSocketId: string, room: string): void{
		const adapter: any = this.server.adapter;
		const roomsRaw: any = adapter.rooms;
//		const roomsArray: string[] = adapter.rooms.keys();

//		console.log(room);
//		console.log(roomsRaw);
//		console.log(roomsRaw.has(room))
		this.server.in(clientSocketId).socketsJoin(room);
		if (!roomsRaw.has(room)){
			

			console.log("no existe room");
			const existRoom = roomsRaw.get(room);

			console.log(existRoom);

			this.logger.log("User " + clientSocketId + "joined room " + room);
		}


//		console.log(roomsRaw.has(room));
//		const filteredRoomsArray: string[] = roomsArray.filter(x => x[0] != '#');

//		const roomsArray: Array<string> = adapter.rooms.keys().filter(x => x[0] != '#');
//		console.log(roomsArray);
  }

  public broadCastToRoom(event: string, payload: ChatMessage): void{
	  this.server.to(payload.room).emit(event, payload)
  }

  public getNumberOfConnectedUsers(): number{
	return this.users.length;
  }

}
