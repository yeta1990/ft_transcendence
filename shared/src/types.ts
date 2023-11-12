import { UserStatus } from './enum'

export type ChatMessage = {
	room: string;
	message: string;
	login: string;
	date: Date;
}

export type ChatMessageComplete = {
	room: string;
	message: string;
	user: ChatUser;
	date: Date;
}

export type SocketPayload = {
	event: string;
	data: any 
}

export type RoomMetaData = {
	room: string;
	owner: string,
	admins: Array<ChatUser>,
	users: Array<ChatUser>,
	banned: Array<ChatUser>,
	silenced: Array<ChatUser>,
	hasPass: boolean,
}

// type to handle relationships between
// client_id provided by socket.io and our identification
export class ChatUser {
	constructor (
		public client_id: string, 
		public user_id: number, 
		public login: string,
		public nick: string,
		public status: UserStatus
	){ }
};

export class RoomMessages {
	constructor( 
		public name: string,
		public messages: Array<ChatMessage>
	){}
}

export interface ToastData {
  status: boolean;
  type: string;
  message: string;
  id: number;
}
