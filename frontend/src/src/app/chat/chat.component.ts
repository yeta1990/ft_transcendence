import { Component, OnInit } from '@angular/core';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
import { ChatMessage, SocketPayload } from '@shared/types';
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {

	newMessage: string = '';
	messageList: any[] = [];
//	messageList: string[] = [];
	currentRoom: string;
	roomList: string[] = ["default"];
	availableRoomsList: string[] = [];

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
			.subscribe((payload: SocketPayload) => {
				console.log("received payload :" + payload.data);
				if (payload.event === 'message'){
					this.messageList.push(payload.data);
				}
				else if (payload.event === 'listRooms'){
//					this.messageList.push("list rooms received", Array.from(payload.data));
					this.availableRoomsList = Array.from(payload.data);
				}

//				this.messageList.push(payload);
			})
		this.chatService.getRoomList();
	}

	processMessageToSend(): void {
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
			this.chatService.sendMessageToChat("message", destination, message);
	}
 
}
