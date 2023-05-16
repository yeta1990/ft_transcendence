import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { environment } from '../../environments/environment'
import { SocketService } from '../socket.service';
import { ChatMessage } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socketService: SocketService = new SocketService("/chat");
	constructor() {}

	getMessage(): Observable<string>{
		return this.socketService.getMessage();
	}

	sendMessage(type: string, room: string, message: string) {
		const payloadToSend: ChatMessage = { room, message }
		this.socketService.sendMessage(type, payloadToSend);
	}


}
