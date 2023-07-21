
export type ChatMessage = {
	room: string;
	message: string;
	nick: string;
	date: Date;
}

export type SocketPayload = {
	event: string;
	data: any 
}

export type RoomMetaData = {
	room: string;
	owner: string,
	admins: Array<string>,
	users: Array<string>,
}

// type to handle relationships between
// client_id provided by socket.io and our identification
export class ChatUser {
	constructor (
		public client_id: string, 
		public user_id: number, 
		public nick: string
	){ }
};

export class RoomMessages {
	constructor( 
		public name: string,
		public messages: Array<ChatMessage>
	){}
}

export type GameStatus = {
	room: string;
	message: string;
	nick: string;
	date: Date;
	player1:boolean;
}
