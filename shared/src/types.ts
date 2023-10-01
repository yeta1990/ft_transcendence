
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

export class GameRoom {
	constructor(
	public room: string,
	public message: string,
	public nick: string,
	public date: Date,
	public y: number,
	public height: number,

	//PaddleOneComponent
	public playerOneX: number,
	public playerOneY: number,
	public playerOneW: number,
	public playerOneH: number,
	public playerOneS: number,

	//PaddleTwoComponent
	public playerTwoX: number,
	public playerTwoY: number,
	public playerTwoW: number,
	public playerTwoH: number,
	public playerTwoS: number,

	//Canvas
	public canvasheight: number,
	public canvasWidth: number,

	//Ball
	public ballHeight: number,
	public ballWidth: number,
	public ballSpeed: number,
	public ballXVel: number,
	public ballYVel: number,
	public ballX: number,
	public ballY: number,
	public ballDir: number,

	//Scores
	public playerOneScore: number,
	public playerTwoScore: number,

	//Mode
	public gameMode: number, //0 for pause or stopped
	public pause: boolean,
	public finish: boolean,

	//Viwer
	public viwer:number,
	public playerOne:string,
	public playerTwo:string,

	){}
}
