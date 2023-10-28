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

  constructor(private userService: UserService, private chatMessageService: ChatMessageService, private pongservice:PongService) {
	super(GameGateway.name);
  }

  async afterInit(): Promise<void> {}

  	@SubscribeMessage('on-line')
	  handleOnLine(client: Socket, login: string){
		this.pongservice.addUserToList(login)
	  }
	
	@SubscribeMessage('keydown')
 	handleMove(client: Socket, payload: any){
		const nick: string = client.handshake.query.nick as string;
		this.pongservice.keyStatus(payload.room, payload.key, nick);
 	}

	@SubscribeMessage('keyup')
 	handleMoveStop(client: Socket, payload: any){
		const nick: string = client.handshake.query.nick as string;
		this.pongservice.keyStatus(payload.room, 0, nick);
 	}


	@SubscribeMessage('updateGame')
  	handleGameUpdate(client: Socket, room: string) {
		const response: GameRoom = this.pongservice.getStatus(room);
		const targetUsers: Array<ChatUser> = this.getActiveUsersInRoom(room);
		for (let i = 0; i < targetUsers.length; i++){
			this.server.to(targetUsers[i].client_id).emit('getStatus', response);
		}	
  	}

  	@SubscribeMessage('join')
  	async handleJoinRoom(client: Socket, roomAndPassword: string): Promise<void>{
		let room: string = roomAndPassword.split(" ", 2)[0];
		const pass: string | undefined = roomAndPassword.split(" ", 2)[1];
		const nick: string = client.handshake.query.nick as string;
		console.log("Try join.");
		if (room.length > 0 && room[0] != '#' && room[0] != '@'){
  	  	room = '#' + room;
  		}
	  	for (const c of values.forbiddenChatRoomCharacters){
			if (room.substr(1, room.length - 1).includes(c)){
				this.server.to(client.id)
					.emit("system", generateSocketErrorResponse(room, 
					`Invalid name for the channel ${room}, try other`).data)
					console.log("Error joining");

				return ;
			} 
	  	} 	  
  	  //check if user is banned from channel
  	  await this.joinRoutine(client.id, nick, room, pass, "join")
  	}

  	async joinRoutine(clientSocketId: string, nick: string, room: string, pass: string, typeOfJoin: string){
	room +=  "_" + nick;
	const originalRoom = room;
	console.log("Try join..");
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
			//const response: ChatMessage = generateJoinResponse(originalRoom);
			var userInRoom = this.getActiveUsersInRoom(room);
			console.log("nick " + nick);
			const response: GameRoom = this.pongservice.initGame(room, this, userInRoom.length, nick);
			//var userInRoom = this.getActiveUsersInRoom('#pongRoom');
			this.pongservice.setPlayer(room, nick);			
			console.log("Join succed to: " + response.room);
			
			this.messageToClient(clientSocketId, 'gameStatus', response);

			//sending old messages of the room, except for those of users that banned
			//the new user trying to join
			if (!wasUserAlreadyActiveInRoom){
				let oldMessagesInRoom: RoomMessages = await this.chatMessageService.getAllMessagesFromRoom(room);

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
	@SubscribeMessage(events.SoftDisconnect)
  softDisconnect(client: Socket): void{
	console.log("HERE DISCONECT");
  	  const activeRooms: Array<string> = this.getActiveRooms()
	  console.log("ACTIVE ROOMS: " + activeRooms);
  	  for (const room of activeRooms){
		this.server.in(client.id).socketsLeave(room);			
  	  }
		const nick: string = client.handshake.query.nick as string;
		this.pongservice.disconectPlayer("#pongRoom_" + nick, nick);

  }
}
