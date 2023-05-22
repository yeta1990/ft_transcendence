
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

// type to handle relationships between
// client_id provided by socket.io and our identification
export class ChatUser {
	constructor (client_id: string, user_id: number, nick: string){
	 }
}

