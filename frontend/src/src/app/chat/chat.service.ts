import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { events } from '@shared/const';
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
		const date: Date = new Date();
		const payloadToSend: ChatMessage = { room, message, nick: "", date}
		this.socketService.sendMessageToChat(type, payloadToSend);
	}

	sendPrivateMessage(destinationNick: string, message: string) {
		const date: Date = new Date();
		const payloadToSend: ChatMessage = { room: destinationNick, message, nick: "", date}
		this.socketService.sendMessageToChat("mp", payloadToSend);
	}

	joinUserToRoom(room: string){
		this.socketService.sendMessageToServer("join", room);
	}

	getRoomList(){
		this.socketService.sendMessageToServer(events.ListAllRooms, "");
		this.socketService.sendMessageToServer(events.ListMyJoinedRooms, "");
		this.socketService.sendMessageToServer(events.ListMyPrivateRooms, "");
	}

	partFromRoom(room: string){
		this.socketService.sendMessageToServer("part", room);
	}

	makeRoomAdmin(nick: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , nick: nick, date: new Date() }
		this.socketService.sendMessageToServer("admin", payloadToSend);
	}

	removeRoomAdmin(nick: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , nick: nick, date: new Date() }
		this.socketService.sendMessageToServer("noadmin", payloadToSend);
	}

	banUserFromRoom(nick:string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , nick: nick, date: new Date() }
		this.socketService.sendMessageToServer("ban", payloadToSend);
	}

	removeBanFromRoom(nick: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , nick: nick, date: new Date() }
		this.socketService.sendMessageToServer("noban", payloadToSend);
	}

}
