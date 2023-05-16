import { 
	OnGatewayInit, 
	OnGatewayConnection, 
	WebSocketServer,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

//this base class is used to log the initialization
//and avoid code duplications in the gateways
export class BaseGateway implements OnGatewayInit, OnGatewayDisconnect {

  @WebSocketServer() server: Server = new Server<any>();

  private readonly logger; 
  gatewayName: string;
  users: string[] = [];

  @Inject(AuthService)
  private authService: AuthService;

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
		this.logger.log(`Socket client connected: ${socket.id}`)
		this.users.push(socket.id);
		this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
	}
	else{
		//disconnect
		return this.disconnect(socket);
	}

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
  public emit(event: string, data: string): void {
  	  this.server.emit(event, data);
  }

  public joinUserToRoom(clientSocketId: string, room: string): void{
	  this.server.in(clientSocketId).socketsJoin(room)
  }

  public broadCastToRoom(room: string, event: string, message: string): void{
	  this.server.to(room).emit(event, message)
  }

  public getNumberOfConnectedUsers(): number{
	return this.users.length;
  }

}