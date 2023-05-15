import { Component, OnInit } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {

	newMessage: string = '';
	messageList: string[] = [];
	constructor(private chatService: ChatService) {}

	//subscription to all events from the service
	ngOnInit(): void {
		this.chatService
			.getMessage()
			.subscribe((message: string) => {
				this.messageList.push(message);
			})
	}
	sendMessage(): void{
		this.chatService.sendMessage("capullo");
	}
 
}
