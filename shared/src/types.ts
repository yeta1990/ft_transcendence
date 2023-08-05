
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

export type GameRoom = {
	room: string;
	message: string;
	nick: string;
	date: Date;
	y: number;
	height: number;

	//PaddleOneComponent
	playerOneX: number;
	playerOneY: number;
	playerOneW: number;
	playerOneH: number;

	//PaddleTwoComponent
	playerTwoX: number;
	playerTwoY: number;
	playerTwoW: number;
	playerTwoH: number;

	//Canvas
	canvasheight: number;
	canvasWidth: number;

	//Ball
	ballHeight: number;
	ballWidth: number;
	ballSpeed: number;
	ballXVel: number;
	ballYVel: number;
	ballX: number;
	ballY: number;

	//Scores
	playerOneScore: number;
	playerTwoScore: number;
}
