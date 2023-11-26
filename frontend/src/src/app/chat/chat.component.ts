import { Component, OnInit, AfterViewInit, QueryList, ElementRef, ViewChild, ViewChildren, OnDestroy} from '@angular/core';
import { ChatService } from './chat.service';
import { FormBuilder } from '@angular/forms';
import { ChatMessage, SocketPayload, RoomMetaData, ToastData } from '@shared/types';
import { events, ToastValues } from '@shared/const';
import { waitSeg } from '@shared/functions';
import { takeUntil } from "rxjs/operators"
import { Subject, Subscription, pipe } from "rxjs"
import { User } from '../user';
import { MyProfileService } from '../my-profile/my-profile.service';
import { ToasterService } from '../toaster/toaster.service'
import { ModalService } from '../modal/modal.service'
import { AuthService } from '../auth/auth.service'
import { UserStatus } from '@shared/enum';
 
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
	//currentRoom: string;
	roomList: string[] = [""];
	availableRoomsList: string[] = [];
	myJointRoomList: string[] = [];
	myPrivateMessageRooms: any[] = [];
//	activeUsers: Array<string> = [];
	roomsMetaData: Map<string, RoomMetaData> = new Map<string, RoomMetaData>();
	loginNickEquivalence: Map<string, string> =new Map();
	myUser: User | undefined;
	private subscriptions = new Subscription();

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
		private toasterService: ToasterService,
		private authService: AuthService

   ) {
		
		//this.currentRoom = this.getCurrentRoom();
		this.messageList.set(this.getCurrentRoom(), new Array<ChatMessage>);
		this.profileService.getUserDetails()
			.subscribe(
				(response: User) => {this.myUser= response;},
			(error) => {console.log(error);}
			);
   }

   getCurrentRoom(): string {
		return this.chatService.getCurrentRoom()
   }

//   joinUserToRoom(roomAndPass: string): void {
   joinUserToRoom(room: string, pass: string): void {
	    //adding a # to those rooms who haven't it
	  	if (room.length > 0 && room[0] != '#' && room[0] != '@') room = '#' + room;
   	      //in case the user was already in that channel
   	      //we want to preserve the historial of the room
		if (!this.messageList.get(room)){
			this.messageList.set(room, new Array<ChatMessage>);
		}
		//sending only one signal to the server with the raw rooms string
		this.chatService.joinUserToRoom([room, pass]);
   }
   getMyBlockedUsers(): Array<string> {
		return this.chatService.getMyBlockedUsers()
   }

	makeRoomAdmin(login:string, room: string){
			this.chatService.makeRoomAdmin(login, room)
	}

	removeRoomAdmin(login: string, room:string){
			this.chatService.removeRoomAdmin(login, room)
	}
	
   banUserFromRoom(nick: string, room: string){
	   this.chatService.banUserFromRoom(nick, room)
   }

   silenceUserFromRoom(nick: string, room: string){
		this.chatService.silenceUserFromRoom(nick, room)
   }

   unSilenceUserFromRoom(nick: string, room: string){
   	   this.chatService.unSilenceUserFromRoom(nick, room)
   }

   unBanUserFromRoom(nick: string, room: string){
	   this.chatService.removeBanFromRoom(nick, room)
   }

   banUser2User(targetNick: string){
  		this.chatService.banUser2User(targetNick) 
   }
	
   addPassToRoom(room: string, pass: string){
		this.chatService.addPassToRoom(room, pass)
	}
   removePassOfRoom(room: string){
		this.chatService.removePassOfRoom(room)
	}


	leaveRoom(room: string): void{
		this.chatService.partFromRoom(room);	
		this.messageList.delete(room);
	}

	//subscription to all events from the service
	ngOnInit(): void {
		this.chatService.forceInit();
		this.subscriptions.add(
			this.chatService
			.getMessage()
			.pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
			.subscribe((payload: SocketPayload) => {
				if (payload.event === 'message'){
					if (!this.messageList.get(payload.data.room)){
						this.messageList.set(payload.data.room, new Array<ChatMessage>);
					}
					this.messageList.get(payload.data.room)!.push(payload.data);
				}
				else if (payload.event === events.ListAllRooms){
					
					const listRoomsReceived: Array<string> = Array.from(payload.data.map((r: any) => r.room));

					//force update room list  in case of differences or lack of information
					const roomListDifferences: Array<string> = this.availableRoomsList.filter(r => !listRoomsReceived.includes(r))
					this.availableRoomsList = Array.from(payload.data.map((r: any) => r.room));
					this.availableRoomsList = this.availableRoomsList.filter(r => !roomListDifferences.includes(r))
					this.myJointRoomList = this.myJointRoomList.filter(r => !roomListDifferences.includes(r))

					payload.data.map((r: RoomMetaData) => {
						if (r.room) this.roomsMetaData.set(r.room, r)
					}
					)


					if (!(this.availableRoomsList).includes(this.getCurrentRoom())){ 
						this.chatService.setCurrentRoom("")
//						this.myJointRoomList.filter(r => r != )
					}
					console.log("setting available room list " + this.availableRoomsList)
					this.chatService.setAvailableRoomsList(this.availableRoomsList);
				}
				else if (payload.event === events.ListMyPrivateRooms){
					this.myPrivateMessageRooms = Array.from(payload.data);
				}
				else if (payload.event === events.ListMyJoinedRooms){
//					console.log("My joined rooms")
//					console.log(payload.data)
					this.myJointRoomList = Array.from(payload.data)	
					if (this.myJointRoomList.length == 0){
						this.chatService.setCurrentRoom("")
					}
					else if (!this.myJointRoomList.includes(this.getCurrentRoom())){
						this.chatService.setCurrentRoom(this.myJointRoomList[0]);
						this.joinUserToRoom(this.getCurrentRoom(), "")
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
					this.chatService.setCurrentRoom(payload.data.room);
					//check if the messageList map has space to store the room messages to prevent errors, but only 100% necessary in joinmp
					if (!this.messageList.has(payload.data.room)){
						this.messageList.set(this.getCurrentRoom(), new Array<ChatMessage>);
					}
				}
				else if (payload.event === 'joinmp'){
					//check if the messageList map has space to store the room messages. in case of private messages, currently it needs to be created:
					if (!this.messageList.has(payload.data.room)){
						this.messageList.set(payload.data.room, new Array<ChatMessage>);
					}
				}
				else if (payload.event === events.ActiveUsers){
					this.chatService.setActiveUsers(payload.data)
				}
				else if (payload.event === events.RoomMetaData){
					console.log("-------rooms metadata--------")
					console.log(payload.data)
					if (payload.data.room.includes(":")){
						this.roomsMetaData.set('@'+payload.data.users.filter((v: string) => v!== this.myUser?.login)[0], payload.data)
					} else {
						this.roomsMetaData.set(payload.data.room, payload.data)
					}
					const it = this.roomsMetaData.entries();
//					for (const el of it){
//						console.log(JSON.stringify(el))
//					}

//					console.log(payload.data.loginNickEquivalence)
				}
				else if (payload.event === events.BlockedUsers){
					this.chatService.setMyBlockedUsers(payload.data)
				}
				else if (payload.event === events.Kicked){
					this.authService.logout()	
				}
				else if (payload.event === events.AllHistoricalMessages){
					
				}
				else if (payload.event === events.LoginNickEquivalence){
					this.chatService.setLoginNickEquivalence(payload.data)
				}
				else if (payload.event === 'otherPlayerPart'){
					this.blockGameModal(payload.data)
				}
				else if (payload.event === 'otherPlayerCameBack'){
					this.modalService.closeModal()
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

	processMessageToSend(): void {
		const messageToSend: string = this.messageToChat.get('newMessage')!.value || "";
		if (messageToSend){
			this.sendMessageToChat("message", this.getCurrentRoom(), messageToSend);
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

	getNickEquivalence(login: string): string | null{
		const loginEquivalence: Array<any> | undefined = this.chatService.getLoginNickEquivalence()
		if (loginEquivalence){
			const foundUser = loginEquivalence.find(u => u.login === login)
			//console.log(foundUser)
			if (foundUser) return foundUser.nick
		}
		return login;
			
	}

	isPrivateRoom(room: string): boolean {
		if (this.roomsMetaData.has(room)){
			const b = this.roomsMetaData.get(room)!.hasPass;
			return b;
		}
		return false
	}

	getActiveUsers() {
		return this.chatService.getActiveUsers()
	}

	isUserActive(login: string): UserStatus {
		return this.chatService.isUserActive(login)
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

	launchToast() {
		this.toasterService.launchToaster(ToastValues.INFO, "my message")
	}

	askForChannelPasswordToJoin(room: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const introducedPass = this.modalService.getModalData()[0];
				this.joinUserToRoom(room, introducedPass);
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template1', room);
	}



	challengeMatchModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const challengeConfirmation = this.modalService.getModalData()[0];
				this.chatService.sendMatchProposal(login)
				console.log("match challenge")
				this.modalClosedSubscription.unsubscribe();
				this.waitForMatchAnswerModal(login)
				return ;
			}

			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template9', login);
	}

	waitForMatchAnswerModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
			this.chatService.cancelMatchProposal(login)
			console.log("cancel match proposal")
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template15', login);
	}


	createChannelModal() {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		console.log(confirm)
      		if (confirm){
				const receivedData = this.modalService.getModalData();
				const room = receivedData[0]
      			const pass = receivedData[1]
				this.joinUserToRoom(room, pass);
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template2');
	}



	banUserFromRoomModal(login: string, room: string){
		if (room.includes("pongRoom") && room.includes(login)) return this.toasterService.launchToaster(ToastValues.ERROR, "You can't ban the other player of the room")
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const banConfirmation = this.modalService.getModalData()[0];
				this.banUserFromRoom(login, room)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template3', [this.getNickEquivalence(login), room]);
	}

	unBanUserFromRoomModal(login: string, room: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const banConfirmation = this.modalService.getModalData()[0];
				this.unBanUserFromRoom(login, room)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template3b', [this.getNickEquivalence(login), room]);
	}

	blockUserModal(login: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const banConfirmation = this.modalService.getModalData()[0];
				this.chatService.banUser2User(login)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template4', this.getNickEquivalence(login));
	}

	unBlockUserModal(login: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const banConfirmation = this.modalService.getModalData()[0];
				this.chatService.noBanUser2User(login)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template5', this.getNickEquivalence(login));
	}

	changePassToRoomModal(room:string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const pass = this.modalService.getModalData()[0];
				this.addPassToRoom(room, pass)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template6', room);
	}

	addPassToRoomModal(room:string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const pass = this.modalService.getModalData()[0];
				this.addPassToRoom(room, pass)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template8', room);
	}

	removePassOfRoomModal(room: string) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const removePassConfirmation = this.modalService.getModalData()[0];
				this.removePassOfRoom(room)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template7', room);
	}

	joinUserToRoomAsViwer(room: string){
		this.chatService.joinUserToRoomAsViwer(room);
	}

	async blockGameModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {

			this.modalClosedSubscription.unsubscribe();
			
    	});
		this.modalService.openModal('template18', login);
		for (let i = 0; i < 11; i++){
			await waitSeg(1)
		}
		this.modalService.closeModal()
	}

}
