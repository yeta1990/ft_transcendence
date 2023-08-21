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


@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor(private userService: UserService, private chatMessageService: ChatMessageService) {
	super(GameGateway.name);
  }

  async afterInit(): Promise<void> {}
  /*
  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> {
    return { event: 'message', data: payload};
  }*/
   
  @SubscribeMessage('up')
	handleUp(client: Socket, payload: GameRoom) {
    console.log("Going up\n");
	const targetUsers: Array<ChatUser> = this
	.getActiveUsersInRoom("#pongRoom")
	console.log("Up: " + targetUsers);
	for (let i = 0; i < targetUsers.length; i++){
	var yVel = -1;
	if(payload.y <= 20)
		yVel = 0
	this.server.to(targetUsers[i].client_id).emit('getSignal', yVel)
	//this.messageToClient(targetUsers[i].client_id, 'getSignal', -1)
	}
    //return { event: 'getSignal', data: -1 };
  }

  @SubscribeMessage('down')
  handleDown(client: Socket, payload: GameRoom) {
    console.log("Going down\n");
	console.log("Going up\n");
	const targetUsers: Array<ChatUser> = this
	.getActiveUsersInRoom("#pongRoom")
	console.log("Down. " + targetUsers);
	var yVel = 1;
	if(payload.y + payload.height >= payload.canvasheight - 20)
		yVel = 0;
	for (let i = 0; i < targetUsers.length; i++){
	this.server.to(targetUsers[i].client_id).emit('getSignal', yVel)
	}
    //return { event: 'getSignal', data: 1 };
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
					console.log("Try join..");

			return ;
		} 
	  }
  	  
  	  //check if user is banned from channel
  	  await this.joinRoutine(client.id, nick, room, pass, "join")
  }

  async joinRoutine(clientSocketId: string, nick: string, room: string, pass: string, typeOfJoin: string){
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
			const response: ChatMessage = generateJoinResponse(originalRoom);
			var userInRoom = this.getActiveUsersInRoom('#pongRoom');
			if (userInRoom.length == 1 || userInRoom[0].nick == nick) //Esto hay que hacer una funcion que lo compruebe siempre
			{
				let gameStatus:GameStatus = { 
					room: '#pongRoom',
					message: '',
					nick: nick,
					date: new Date,
					player1:true};
				}	
			else{
				let gameStatus:GameStatus = { 
					room: '#pongRoom',
					message: '',
					nick: nick,
					date: new Date,
					player1:false};
			}
			this.messageToClient(clientSocketId, 'gameStatus', response);

			//sending old messages of the room, except for those of users that banned
			//the new user trying to join
			if (!wasUserAlreadyActiveInRoom){
				let oldMessagesInRoom: RoomMessages = 
					await this.chatMessageService.getAllMessagesFromRoom(room);

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
}

class Ball {

    //private speed:number = 5;
	//ballHeight: number;
	//ballWidth: number;
	//ballSpeed: number;
	//ballXVel: number;
	//ballYVel: number;
	//ballX: number;
	//ballY: number;

    constructor(game: GameRoom){
		game.ballWidth = 10;
		game.ballHeight = 10;
		game.ballX = game.canvasWidth / 2 - 10 / 2;
		game.ballY = game.canvasheight/ 2 - 10 / 2;
		game.ballSpeed = 5;
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            game.ballXVel = 1;
        }else{
            game.ballXVel = -1;
        }
        game.ballYVel = 1;
    }

    update(game: GameRoom){ //game = payload
 
    //check top canvas bounds
        if(game.ballY <= 10){
          game.ballYVel = 1;
        }
    //check bottom canvas bounds
        if(game.ballY + game.ballHeight >= game.canvasheight - 10){
			game.ballYVel = -1;
        }
    //check left canvas bounds
        if(game.ballX <= 0){  
            game.ballX = game.canvasWidth / 2 - game.ballWidth / 2;
            game.playerTwoScore += 1;
        }
    //check right canvas bounds
        if(game.ballX + game.ballWidth >= game.canvasWidth){
            game.ballX = game.canvasWidth / 2 - game.ballWidth / 2;
            game.playerOneScore += 1;
        }
    //check player collision
        if(game.ballX <= game.playerOneX + game.playerOneW){
            if(game.ballY >= game.playerOneY && game.ballY + game.ballHeight <= game.playerOneY + game.playerOneH){
            game.ballXVel = 1;
            }
        }
    //check computer collision
        if(game.ballX + game.ballWidth >= game.playerTwoX){
            if(game.ballY >= game.playerTwoY && game.ballY + game.ballHeight <= game.playerTwoY + game.playerTwoH){
                game.ballXVel = -1;
            }
        }
	game.ballX += game.ballXVel * game.ballSpeed;
    game.ballY += game.ballYVel * game.ballSpeed;
    }
}