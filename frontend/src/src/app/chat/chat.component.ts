import { Component, OnInit, AfterViewInit, QueryList, ElementRef, ViewChild, ViewChildren} from '@angular/core';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
import { ChatMessage, SocketPayload } from '@shared/types';
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, AfterViewInit {
	@ViewChildren('messages') messages!: QueryList<any>;
	@ViewChild('chatBox') content!: ElementRef;


	newMessage: string = '';
	messageList: ChatMessage[] = [];
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
				if (payload.event === 'message'){
					this.messageList.push(payload.data);
				}
				else if (payload.event === 'listRooms'){
					this.availableRoomsList = Array.from(payload.data);
				}
				else if (payload.event === 'help'){
					console.log("received help response");
					this.messageList.push(payload.data);
				}
        		this.scrollToBottom();
			})
		this.chatService.joinUserToRoom("room1");
		this.chatService.joinUserToRoom("room2");
		this.chatService.getRoomList();

	}

	ngAfterViewInit() {        
        this.scrollToBottom();
        this.messages.changes.subscribe(this.scrollToBottom); 
    } 

	scrollToBottom = () => {
		try {
			this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight;
		} catch (err) {}
	}

	processCommandToSend(command: string): void {
		if (command && command=== '/help'){
			this.sendMessageToChat("help", this.currentRoom, command);
		}
	}

	processMessageToSend(): void {
		const messageToSend: string = this.messageToChat.get('newMessage')!.value || "";
		if (messageToSend && messageToSend[0] === '/'){
			this.processCommandToSend(messageToSend);
		}
		else if (messageToSend && messageToSend[0] === '/'){
			console.log("let's parse this");
		}
		else if (messageToSend){
			this.sendMessageToChat("message", this.currentRoom, messageToSend);
		}
		this.messageToChat.get('newMessage')!.setValue('');
	}

	sendMessageToChat(event: string, destination:string, message: string): void{
		if (message)
			this.chatService.sendMessageToChat(event, destination, message);
	}

	goToChatRoom(room: string): void{
		console.log("go to chat room " + room);
	}
 
}
