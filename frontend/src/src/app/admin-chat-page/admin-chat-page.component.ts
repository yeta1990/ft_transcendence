import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../chat/chat.service';
import { takeUntil } from "rxjs/operators"
import { Subject, Subscription, pipe } from "rxjs"
import { ChatMessage, SocketPayload, RoomMetaData, RoomMessages} from '@shared/types';
import { events } from '@shared/const';


@Component({
  selector: 'app-admin-chat-page',
  templateUrl: './admin-chat-page.component.html',
  styleUrls: ['./admin-chat-page.component.css']
})

export class AdminChatPageComponent implements OnInit {
	@ViewChildren('messages') messages!: QueryList<any>;
	@ViewChild('chatBox') content!: ElementRef;

	rooms: any 
	private subscriptions = new Subscription();
	roomsMetaData: Map<string, RoomMetaData> = new Map<string, RoomMetaData>();
	messageList: Map<string, ChatMessage[]> = new Map<string, ChatMessage[]>();
	destroy: Subject<any> = new Subject();

	constructor(private chatService: ChatService, ) {}

	ngOnInit(): void {
		this.chatService.forceInit()
		this.chatService.adminJoin()

		this.subscriptions.add(
			this
				.chatService
				.getMessage()
				.pipe(takeUntil(this.destroy))
				.subscribe((payload: SocketPayload) => {
					if (payload.event === events.AllHistoricalMessages) {
						payload.data.forEach((roomMessages: RoomMessages) => {
							this.messageList.set(roomMessages.name, roomMessages.messages)
						})
        				this.scrollToBottom();
					}
					else if (payload.event === events.AllRoomsMetaData){
//						const data: RoomMetaData[] = payload.data
						for (const room of payload.data){
							this.roomsMetaData.set(room.room, room)
							console.log(room)
						}

        				this.scrollToBottom();
					}
        			this.scrollToBottom();
				}
		)
		)
	}

	ngOnDestroy() {
		//a trick to finish subscriptions (second part)
		this.destroy.next("");
		this.destroy.complete();

		//this is a soft disconnect, not a real disconnect
  		//when the chat component disappears (bc user has clicked
  		//in other section of the site)
  		//this way we force the server to send the historial of each joined room
  		//in case the component appears again in the client
		this.chatService.disconnectClient();
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

	destroyRoom(room: string) {

	}

}
