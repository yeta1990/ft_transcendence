import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from './base.gateway';
import { Socket } from 'socket.io';
import { ChatMessage, SocketPayload } from '@shared/types';
import { RoomMessages, ChatUser } from '@shared/types';

@WebSocketGateway({ namespace: '/game', cors: true } )
export class GameGateway extends BaseGateway {

  constructor() {
	super(GameGateway.name);
  }

  async afterInit(): Promise<void> {}
  /*
  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> {
    return { event: 'message', data: payload};
  }*/
   
  @SubscribeMessage('up')
  handleUp(client: Socket, payload: ChatMessage) {
    console.log("Going up\n");
    return { event: 'getSignal', data: -1 };
  }

  @SubscribeMessage('down')
  handleDown(client: Socket, payload: ChatMessage) {
    console.log("Going down\n");
    return { event: 'getSignal', data: 1 };
  }

  @SubscribeMessage('join')
  async handleJoinRoom(client: Socket, rooms: string): Promise<void>{
//  	  console.log("join message received: " + rooms);
	  const splittedRooms: Array<string> = rooms.split(" ", 1)[0].split(",");
	  const pass: string | undefined = rooms.split(" ")[1];
	  let lastJoinedRoom: string;
	  const adapter: any = this.server.adapter;
	  const roomsRaw: any = adapter.rooms;

	  for (let room of splittedRooms) {
	  	  if (room.length > 0 && room[0] != '&'){
	  	  	lastJoinedRoom = '&' + room;
	  	  } else {
	  	  	lastJoinedRoom = room;
	  	  }
		  let isUserAlreadyActiveInRoom: boolean = false;
		  try {
		  	const activeUsersInRoom: Array<ChatUser> = this.getActiveUsersInRoom(room);
    		for (let i = 0; i < activeUsersInRoom.length; i++){
  				if (client.id === activeUsersInRoom[i].client_id){
  					isUserAlreadyActiveInRoom = true;
  					break ;
  				}
  		    }
		  } catch {}

		  const successfulJoin = await 
			this.joinUserToRoom(client, lastJoinedRoom, pass);

		  if (successfulJoin){
	 	  	const response: ChatMessage = {
		  	    room: lastJoinedRoom,
		  	    message: `you are in room ${lastJoinedRoom}`,
		  	    nick: "system",
		  	    date: new Date()
		  	}
			this.messageToClient(client.id, "join", response);
			if (!isUserAlreadyActiveInRoom){ 
				const oldMessagesInRoom: RoomMessages = 
					await this.chatMessageService.getAllMessagesFromRoom(lastJoinedRoom);
				for (let message of oldMessagesInRoom.messages){
					this.messageToClient(client.id, "message", message)
				}
			}
		  }
	  }
  }
}
