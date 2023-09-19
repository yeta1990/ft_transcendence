import { Injectable } from '@angular/core';
import { SocketService } from '../socket.service';
import { Subject, from, Observable } from  'rxjs';
import { ChatMessage, GameRoom, SocketPayload } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class PongService {

  private socketService: SocketService = new SocketService("/game")
  constructor() { }

  getMessage(): Observable<SocketPayload>{
		return this.socketService.getMessage();
	}

  sendSignal(type: string, room: string, key: number) {
    //const date: Date = new Date();
		//const payloadToSend: ChatMessage = { room, message, nick: "", date}
    //const payloadToSend: GameRoom = { room:room }
		this.socketService.sendMove(type, room, key);
	}

  joinUserToRoom(room: string){
		this.socketService.sendMessageToServer("join", room);
	}

  gameUpdate(room: string) {
    this.socketService.sendMessageToServer("updateGame", room);
  }

}
