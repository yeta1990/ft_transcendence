import { 
	OnGatewayInit, 
	OnGatewayConnection, 
	WebSocketServer,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

//this base class is used to log the initialization
//and avoid code duplications in the gateways
export class BaseGateway implements OnGatewayInit, OnGatewayDisconnect {

  @WebSocketServer() server: Server = new Server<any>();

  private readonly logger; 
  gatewayName: string;
  users: string[] = [];

  constructor(name: string){
	this.gatewayName = name;
	this.logger = new Logger(this.gatewayName);
  }

  afterInit(): void {
	this.logger.log(this.gatewayName + ' initialized');
  }

  handleConnection(socket: Socket): void {
	this.logger.log(`Socket client connected: ${socket.id}`)
	this.users.push(socket.id);
	this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
  }

  handleDisconnect(socket: Socket): void {
	this.logger.log(`Socket client disconnected: ${socket.id}`)
	this.users = this.users.filter(e => e !== socket.id);
	this.logger.log(this.getNumberOfConnectedUsers() + " users connected")
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
