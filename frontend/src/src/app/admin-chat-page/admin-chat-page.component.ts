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

	private subscriptions = new Subscription();
	roomsMetaData: Map<string, RoomMetaData> = new Map<string, RoomMetaData>();
	rooms: Array<string> = []
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
						const roomSet: Set<string> = new Set()
						for (const room of payload.data){
							this.roomsMetaData.set(room.room, room)
							roomSet.add(room.room)
						}
						this.rooms = Array.from(roomSet)
        				this.scrollToBottom();
					}
					else if (payload.event === events.MessageForWebAdmins){
						let messagesChannel: Array<ChatMessage> = this.messageList.get(payload.data.room)!
						//for receiving messages from new created channels
						if (!messagesChannel){
							messagesChannel = [payload.data]
						} 
						else{
							messagesChannel!.push(payload.data)
						}	
						this.messageList.set(payload.data.room, messagesChannel)
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
		this.chatService.adminDestroyRoom(room)
	}
	
	banUser(room:string, login:string) {
		this.chatService.adminBanUserOfRoom(room, login)
	}

	removeBan(room:string, login:string) {
		this.chatService.adminRemoveBanOfRoom(room, login)
	}

	silenceUser(room:string, login:string) {
		this.chatService.adminSilenceUserOfRoom(room, login)
	}

	unSilenceUser(room:string, login:string) {
		this.chatService.adminRemoveSilenceUserOfRoom(room, login)
	}

	makeAdmin(room:string, login:string) {
		this.chatService.adminMakeRoomAdmin(room, login)
	}

	revokeAdmin(room:string, login:string) {
		this.chatService.adminRevokeRoomAdmin(room, login)
	}

	makeOwner(room:string, login:string) {
		this.chatService.adminMakeRoomOwner(room, login)
	}

	revokeOwner(room:string, login:string) {
		this.chatService.adminRevokeRoomOwner(room, login)
	}

	isSilenced(room:string, login:string): boolean {
		const foundRoom  =   this.roomsMetaData.get(room)
		if (!foundRoom) return false;
		const silenced: Array<string> = foundRoom.silenced.map(f => f.login)
		return silenced.includes(login)
	}

	isOwner(room: string, login: string): boolean {
		if (login == null) return false;
		const foundRoom = this.roomsMetaData.get(room)
		if (!foundRoom) return false;
		return foundRoom.owner === login
	}

	isAdmin(room: string, login: string): boolean {
		const foundRoom  =   this.roomsMetaData.get(room)
		if (!foundRoom) return false;
		const admins: Array<string> = foundRoom.admins.map(f => f.login)
		return admins.includes(login)
	}

	isUser(room: string, login: string):boolean {
		const foundRoom  =   this.roomsMetaData.get(room)
		if (!foundRoom) return false;
		const users: Array<string> = foundRoom.users.map(f => f.login)
		return users.includes(login)
	}

	isBanned(room: string, login:string): boolean {
		const foundRoom  =   this.roomsMetaData.get(room)
		if (!foundRoom) return false;
		const banned: Array<string> = foundRoom.banned.map(f => f.login)
		return banned.includes(login)
	}

	getRoomsMessages(room: string) {
		return this.messageList.get(room)
	}

}
