
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
export type ChatUser = {
	client_id: string; //provided by socket.io
	user_id: number, //stored user_id in db
	nick: string
}

