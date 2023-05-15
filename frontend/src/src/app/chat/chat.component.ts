import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';
import { ChatService } from './chat.service';
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {

	newMessage: string = '';
	messageList: string[] = [];
	private socketService: SocketService = new SocketService("/chat");

	constructor() {}

	//subscription to all events from the service
	ngOnInit(): void {
		this.socketService
			.getMessage()
			.subscribe((message: string) => {
				this.messageList.push(message);
			})
	}

	sendMessage(): void{
		this.socketService.sendMessage("message", "destination: hello to everyone");
		this.socketService.sendMessage("join", "#channel");
	}
 
}
