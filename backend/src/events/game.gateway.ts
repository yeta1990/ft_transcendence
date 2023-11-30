import {Logger} from '@nestjs/common'
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, GameRoom, SocketPayload } from '@shared/types';
import { RoomMessages, ChatUser, GameStatus } from '@shared/types';
import { events, values } from '@shared/const';
import { generateJoinResponse } from '@shared/functions';
import { generateSocketErrorResponse, generateSocketInformationResponse } from '@shared/functions';
import { UserService } from '../user/user.service';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { PongService } from 'src/pong/pong.service';


@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor(private chatMessageService: ChatMessageService) {
  	super();
  	this.gatewayName = "ChatGateway"
	//this.gatewayName = "GameGateway"
	this.logger = new Logger(this.gatewayName); 
  }


  async afterInit(): Promise<void> {}

  	@SubscribeMessage('on-line')
	  handleOnLine(client: Socket, login: string){		
		const loginBack: string = client.handshake.query.login as string;
		this.pongservice.addUserToList(loginBack)
	  }
	
	@SubscribeMessage('keydown')
 	handleMove(client: Socket, payload: any){
		const login: string = client.handshake.query.login as string;
		this.pongservice.keyStatus(payload.room, payload.key, login);
 	}

	@SubscribeMessage('keyup')
 	handleMoveStop(client: Socket, payload: any){
		const login: string = client.handshake.query.login as string;
		this.pongservice.keyStatus(payload.room, 0, login);
 	}


	@SubscribeMessage('updateGame')
  	handleGameUpdate(client: Socket, room: string) {
		const response: GameRoom = this.pongservice.getStatus(room);
		const targetUsers: Array<ChatUser> = this.getActiveUsersInRoom(room);
		for (let i = 0; i < targetUsers.length; i++){
			this.server.to(targetUsers[i].client_id).emit('getStatus', response);
		}	
  	}

	@SubscribeMessage(events.SoftDisconnect)
  softDisconnect(client: Socket): void{
  	  const activeRooms: Array<string> = this.getActiveRooms()
  	  for (const room of activeRooms){
		this.server.in(client.id).socketsLeave(room);			
  	  }
		const login: string = client.handshake.query.login as string;
		this.pongservice.disconectPlayer("#pongRoom_" + login, login);

  }
}
