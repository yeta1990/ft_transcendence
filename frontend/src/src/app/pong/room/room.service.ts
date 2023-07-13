import { Injectable } from '@angular/core';
import { SocketService } from '../../socket.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private socketService: SocketService = new SocketService("/game");
  constructor() { }

  joinUserToRoom(room: string){
		this.socketService.sendMessageToServer("join", room);
	}

  partFromRoom(room: string){
		this.socketService.sendMessageToServer("part", room);
	}

  makeRoomAdmin(nick: string, room: string){
		//const payloadToSend: ChatMessage = { room: room, message: "" , nick: nick, date: new Date() }
		//this.socketService.sendMessageToServer("admin", payloadToSend);
	}
}


