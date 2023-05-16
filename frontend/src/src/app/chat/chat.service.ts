import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { environment } from '../../environments/environment'
import { SocketService } from '../socket.service';
import { ChatMessage, SocketPayload } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socketService: SocketService = new SocketService("/chat");
	constructor() {}

	getMessage(): Observable<SocketPayload>{
		return this.socketService.getMessage();
	}

	sendMessageToChat(type: string, room: string, message: string) {
		const payloadToSend: ChatMessage = { room, message }
		this.socketService.sendMessageToChat(type, payloadToSend);
	}

	getRoomList(){
		this.socketService.sendMessage("listRooms", "");
	}


}
