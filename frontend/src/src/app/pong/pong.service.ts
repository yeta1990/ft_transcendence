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

  sendSignal(type: string, room: string, message: string, y: number, height: number, canvasheight:number) {
    const date: Date = new Date();
		//const payloadToSend: ChatMessage = { room, message, nick: "", date}
    // const payloadToSend: GameRoom = { room:room, message:message, nick: "", date:date, y:y, height:height, canvasheight:canvasheight}
		// this.socketService.sendSignal(type, payloadToSend);
	}

  joinUserToRoom(room: string){
		this.socketService.sendMessageToServer("join", room);
	}

}
