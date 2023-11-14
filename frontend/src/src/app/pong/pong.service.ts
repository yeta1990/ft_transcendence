import { Injectable } from '@angular/core';
import { SocketService } from '../socket.service';
import { Subject, from, Observable } from  'rxjs';
import { ChatMessage, GameRoom, SocketPayload } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class PongService {

  constructor(private socketService: SocketService) {
	}

	forceInit() {
		if (!this.socketService.isConnected()) this.socketService.initializeSocket("/game")
	}
  getMessage(): Observable<SocketPayload>{
    console.log("1HOLA");
		return this.socketService.getMessage();
	}

  sendSignal(type: string, room: string, key: number) {
    //const date: Date = new Date();
		//const payloadToSend: ChatMessage = { room, message, nick: "", date}
    //const payloadToSend: GameRoom = { room:room }
		this.socketService.sendMove(type, room, key);
	}

  joinUserToRoom(room: string){
    room += " alone"; //alone for know play alone
		//console.log(room)
		this.socketService.sendMessageToServer("joinGame", room);
		console.log("enviando join")
	}

  gameUpdate(room: string) {
    this.socketService.sendMessageToServer("updateGame", room);
  }

  disconnectClient(){
		this.socketService.disconnectClient();
	}

  playOnLine(login: string) {
    this.socketService.sendMessageToServer("on-line", login);
  }

}
