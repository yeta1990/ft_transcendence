import { Component, OnInit } from '@angular/core';
//import { SocketService } from '../socket.service';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {

	newMessage: string = '';
	messageList: string[] = [];
	currentRoom: string;
//	private chatService: SocketService = new SocketService("/chat");

//	private chatService: ChatService;

	messageToChat = this.formBuilder.group({
		newMessage: ''
	});
	constructor(
		private chatService: ChatService, 
		private formBuilder: FormBuilder,
   ) {
		this.currentRoom = "default";
   }

	//subscription to all events from the service
	ngOnInit(): void {
		this.chatService
			.getMessage()
			.subscribe((message: string) => {
				this.messageList.push(message);
			})
	}

	processMessage(): void {
		const messageToSend: string = this.messageToChat.get('newMessage')!.value || "";
		if (messageToSend && messageToSend[0] === '/'){
			console.log("let's parse this");
		}
		else if (messageToSend){
			this.sendMessage("message", this.currentRoom, messageToSend);
			this.messageToChat.get('newMessage')!.setValue('');
		}
	}

	sendMessage(event: string, destination:string, message: string): void{
//		const messageToSend = this.messageToChat.get('newMessage')!.value;
		if (message)
			this.chatService.sendMessage("message", destination, message);
	}
 
}
