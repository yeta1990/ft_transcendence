import { Component, OnInit, AfterViewInit, QueryList, ElementRef, ViewChild, ViewChildren, OnDestroy} from '@angular/core';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
import { ChatMessage, SocketPayload, RoomMetaData, ToastData } from '@shared/types';
import { events, ToastValues } from '@shared/const';
import { takeUntil } from "rxjs/operators"
import { Subject, Subscription, pipe } from "rxjs"
import { User } from '../user';
import { MyProfileService } from '../my-profile/my-profile.service';
import { ToasterService } from '../toaster/toaster.service'
import { ModalService } from '../modal/modal.service'
 
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
	roomList: string[] = [""];
	availableRoomsList: string[] = [];
	myJointRoomList: string[] = [];
	myPrivateMessageRooms: string[] = [];
	activeUsers: Array<string> = [];
	roomsMetaData: Map<string, RoomMetaData> = new Map<string, RoomMetaData>();
	myUser: User | undefined;
	private subscriptions = new Subscription();
	myBlockedUsers: Array<string> = []

	destroy: Subject<any> = new Subject();
	private modalClosedSubscription: Subscription = {} as Subscription;

	messageToChat = this.formBuilder.group({
		newMessage: ''
	});
	constructor(
		private chatService: ChatService,
		private formBuilder: FormBuilder,
		private profileService: MyProfileService,
		private modalService: ModalService,
		private toasterService: ToasterService
   ) {
		this.currentRoom = "";
		this.messageList.set(this.currentRoom, new Array<ChatMessage>);
		this.profileService.getUserDetails()
			.subscribe(
				(response: User) => {this.myUser= response;},
			(error) => {console.log(error);}
			);
   }

   joinUserToRoom(roomAndPass: string): void {
	    //adding a # to those rooms who haven't it
	  	if (roomAndPass.length > 0 && roomAndPass[0] != '#') roomAndPass = '#' + roomAndPass;
   	      //in case the user was already in that channel
   	      //we want to preserve the historial of the room
		if (!this.messageList.get(roomAndPass)){
			this.messageList.set(roomAndPass, new Array<ChatMessage>);
		}
		//sending only one signal to the server with the raw rooms string
		this.chatService.joinUserToRoom(roomAndPass.trim());
   }
	
   banUserFromRoom(nick: string, room: string){
	   this.chatService.banUserFromRoom(nick, room)
   }

   banUser2User(targetNick: string){
  		this.chatService.banUser2User(targetNick) 
   }


	leaveRoom(room: string): void{
		this.chatService.partFromRoom(room);	
	}

	//subscription to all events from the service
	ngOnInit(): void {
		this.profileService.getUserDetails()
		this.subscriptions.add(
			this.chatService
			.getMessage()
			.pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
			.subscribe((payload: SocketPayload) => {
				if (payload.event === 'message'){
					this.messageList.get(payload.data.room)!.push(payload.data);
				}
				else if (payload.event === events.ListAllRooms){
					this.availableRoomsList = Array.from(payload.data.map((r: any) => r.room));
					payload.data.map((r: RoomMetaData) => {
						if (r.room) this.roomsMetaData.set(r.room, r)
					}
					)
				}
				else if (payload.event === events.ListMyPrivateRooms){
					this.myPrivateMessageRooms = Array.from(payload.data);
				}
				else if (payload.event === events.ListMyJoinedRooms){
					this.myJointRoomList = Array.from(payload.data)	
					if (this.myJointRoomList.length == 0){
						this.currentRoom = "";
					}
					else if (!this.myJointRoomList.includes(this.currentRoom)){
						this.currentRoom = this.myJointRoomList[0];
						this.joinUserToRoom(this.currentRoom)
					}
				}
				else if (payload.event === 'system'){
//					old method to log a message in the chat window
//					this.messageList.get(this.currentRoom)!.push(payload.data);

//					new method to log a message in a toaster
					console.log(payload.data)
					this.toasterService.launchToaster(ToastValues.INFO, payload.data.message)
				}
				else if (payload.event === 'system-error'){
					this.toasterService.launchToaster(ToastValues.ERROR, payload.data.message)
				}
				else if (payload.event === 'join'){
					this.currentRoom = payload.data.room;
					//check if the messageList map has space to store the room messages to prevent errors, but only 100% necessary in joinmp
					if (!this.messageList.has(payload.data.room)){
						this.messageList.set(this.currentRoom, new Array<ChatMessage>);
					}
				}
				else if (payload.event === 'joinmp'){
					//check if the messageList map has space to store the room messages. in case of private messages, currently it needs to be created:
					if (!this.messageList.has(payload.data.room)){
						this.messageList.set(payload.data.room, new Array<ChatMessage>);
					}
				}
				else if (payload.event === events.ActiveUsers){
					this.activeUsers = payload.data;
				}
				else if (payload.event === events.RoomMetaData){
					console.log("-------rooms metadata--------")
					console.log(payload.data)
					this.roomsMetaData.set(payload.data.room, payload.data)
					const it = this.roomsMetaData.entries();
					for (const el of it){
						console.log(JSON.stringify(el))
					}
					console.log("-----end of rooms metadata-----")
				}
				else if (payload.event === events.BlockedUsers){
					this.myBlockedUsers = payload.data;
				}
        		this.scrollToBottom();
			})
		);
		this.chatService.getRoomList();
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

	processCommandToSend(command: string): void {
		//possibly unnecessary this check
		if (!command)
			return ;
		const splittedCommand: Array<string> = command.split(" ");
		if (splittedCommand[0] === '/help'){
			this.sendMessageToChat("help", this.currentRoom, command);
		}
		else if (splittedCommand[0] === '/join' && splittedCommand.length > 2){
			//channel list comma-separated and password
			this.joinUserToRoom(splittedCommand[1] + " " + splittedCommand[2]);
		}
		else if (splittedCommand[0] === '/join'){
			//channel list comma-separated and password
			this.joinUserToRoom(splittedCommand[1]);
		}
		else if (splittedCommand[0] === '/part'){
			//channel list comma-separated and password
			this.chatService.partFromRoom(splittedCommand[1]);
			this.messageList.delete(splittedCommand[1]);
		}
		else if (splittedCommand[0] === '/admin'){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.makeRoomAdmin(splittedCommand[1], splittedCommand[2])
		}
		else if (splittedCommand[0] === '/noadmin'){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.removeRoomAdmin(splittedCommand[1], splittedCommand[2])
		}
		else if (splittedCommand[0] === '/ban'){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.banUserFromRoom(splittedCommand[1], splittedCommand[2])
		}
		else if (splittedCommand[0] === '/noban'){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.removeBanFromRoom(splittedCommand[1], splittedCommand[2])
		}
		else if (splittedCommand[0] === '/mp'){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.sendPrivateMessage(splittedCommand[1], command.split(":", 2)[1])
		}
		else if (splittedCommand[0] === '/banuser'){
			if (splittedCommand.length < 2)
				return ;
			this.chatService.banUser2User(splittedCommand[1])
		}
		else if (splittedCommand[0] === '/nobanuser'){
			if (splittedCommand.length < 2)
				return ;
			this.chatService.noBanUser2User(splittedCommand[1])
		}
		else if (splittedCommand[0] === '/' + events.Pass){
			if (splittedCommand.length < 3)
				return ;
			this.chatService.addPassToRoom(splittedCommand[1], command.split(" ", 3)[2])
		}
		else if (splittedCommand[0] === '/' + events.RemovePass){
			if (splittedCommand.length < 2)
				return ;
			this.chatService.removePassOfRoom(splittedCommand[1])
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

	isPrivateRoom(room: string): boolean {
		if (this.roomsMetaData.has(room)){
			const b = this.roomsMetaData.get(room)!.hasPass;
			return b;
		}
		return false
	}

	launchToast() {
		this.toasterService.launchToaster(ToastValues.INFO, "my message")
	}

	askForChannelPasswordToJoin(room: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const introducedPass = this.modalService.getModalData()[0];
			console.log(room + " " + introducedPass)
			this.joinUserToRoom(room + " " + introducedPass);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template1', room);
	}

	createChannelModal() {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
			const receivedData = this.modalService.getModalData();
			const room = receivedData[0]
      		const pass = receivedData[1]
			this.joinUserToRoom(room + " " + pass);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template2');
	}

	banUserFromRoomModal(nick: string, room: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const banConfirmation = this.modalService.getModalData()[0];
			this.banUserFromRoom(nick, room)
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template3', [nick, room]);
	}

	blockUserModal(targetUser: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const banConfirmation = this.modalService.getModalData()[0];
			this.chatService.banUser2User(targetUser)
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template4', targetUser);
	}

	unBlockUserModal(targetUser: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const banConfirmation = this.modalService.getModalData()[0];
			this.chatService.noBanUser2User(targetUser)
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template5', targetUser);
	}
}
