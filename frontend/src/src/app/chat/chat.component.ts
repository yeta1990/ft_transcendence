import { Component, OnInit, AfterViewInit, QueryList, ElementRef, ViewChild, ViewChildren, OnDestroy} from '@angular/core';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
import { ChatMessage, SocketPayload } from '@shared/types';
import { takeUntil } from "rxjs/operators"
import { Subject, Subscription, pipe } from "rxjs"
 
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChildren('messages') messages!: QueryList<any>;
	@ViewChild('chatBox') content!: ElementRef;

	newMessage: string = '';
	messageList: Map<string, ChatMessage[]> = new Map<string, ChatMessage[]>();
	currentRoom: string;
	roomList: string[] = ["default"];
	joinedRooms: Set<string> = new Set<string>//;["default"];
	availableRoomsList: string[] = [];
	private subscriptions = new Subscription();

	destroy: Subject<any> = new Subject();

	messageToChat = this.formBuilder.group({
		newMessage: ''
	});
	constructor(
		private chatService: ChatService, 
		private formBuilder: FormBuilder,
   ) {
		this.currentRoom = "default";
   }

   joinUserToRoom(rooms: string): void {
   	   	//splitting the channels in case they come as a comma-separated list
	  	const splittedRooms: Array<string> = rooms.split(",");
		splittedRooms.forEach((room) => {
			this.messageList.set(room, new Array<ChatMessage>);
		})
		//sending only one signal to the server
		this.chatService.joinUserToRoom(rooms);
		this.currentRoom = splittedRooms[splittedRooms.length - 1];
   }

	//subscription to all events from the service
	ngOnInit(): void {
		this.joinUserToRoom("default");
		this.subscriptions.add(
			this.chatService
			.getMessage()
			.pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
			.subscribe((payload: SocketPayload) => {
				if (payload.event === 'message'){
					console.log(payload.data);
					this.messageList.get(payload.data.room)!.push(payload.data);
				}
				else if (payload.event === 'listRooms'){
					this.availableRoomsList = Array.from(payload.data);
				}
				else if (payload.event === 'system'){
					console.log("received help response");
					this.messageList.get(this.currentRoom)!.push(payload.data);
//					this.joinUserToRoom("room");
//					this.currentRoom = "room";
				}
        		this.scrollToBottom();
			})
		);

//		this.chatService.joinUserToRoom("room1");
//		this.chatService.joinUserToRoom("room2");
		this.chatService.getRoomList();
	}

	ngOnDestroy() {
		//a trick to finish subscriptions (second part)
		this.destroy.next("");
		this.destroy.complete();
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
		if (!command)
			return ;
		const splittedCommand: Array<string> = command.split(" ", 2);
		//possibly unnecessary
		if (splittedCommand[0] === '/help'){
			this.sendMessageToChat("help", this.currentRoom, command);
		}
		else if (splittedCommand[0] === '/join'){
			this.joinUserToRoom(splittedCommand[1]);
		}

	}

	processMessageToSend(): void {
		const messageToSend: string = this.messageToChat.get('newMessage')!.value || "";
		if (messageToSend && messageToSend[0] === '/'){
			this.processCommandToSend(messageToSend);
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
