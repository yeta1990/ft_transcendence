import { Injectable } from '@angular/core';
import { SocketService } from '../socket.service';
import { Subject, from, Observable } from  'rxjs';
import { ChatMessage, GameRoom, SocketPayload } from '@shared/types';
import { PongComponent } from './pong.component';

@Injectable({
  providedIn: 'root'
})
export class PongService {

	eventSubscribed: boolean = false;
  public _onlineBoolean: boolean = false;
  constructor(private socketService: SocketService) {
    
	}

  get onlineBoolean(): boolean {
    return this._onlineBoolean;
  }

    public game: GameRoom = {} as GameRoom;

	getGame(): GameRoom {
		return this.game;
	}

	setGame(game: GameRoom) {
		this.game = game;	
	}

	setEventSubscribed(active: boolean){ this.eventSubscribed = active}
	getEventSubscribed(): boolean {return this.eventSubscribed}
  // set onlineBoolean(value: boolean) {
  //   this._onlineBoolean = value;
  // }
	forceInit() {
		if (!this.socketService.isConnected()) this.socketService.initializeSocket("/game")
	}
  getMessage(): Observable<SocketPayload>{
		return this.socketService.getMessage();
	}

  sendSignal(type: string, room: string, key: number) {
    //const date: Date = new Date();
		//const payloadToSend: ChatMessage = { room, message, nick: "", date}
    //const payloadToSend: GameRoom = { room:room }
//      	console.log(type)
//      	console.log(room)
//      	console.log(key)
		this.socketService.sendMove(type, room, key);
	}

  joinUserToRoom(room: string){
    room += " alone"; //alone for know play alone
		//console.log(room)
		this.socketService.sendMessageToServer("joinGame", room);
	}

  joinUserToRoomAsViwer(room: string){
		this.socketService.sendMessageToServer("joinGameAsViwer", room);
	}

  gameUpdate(room: string) {
    this.socketService.sendMessageToServer("updateGame", room);
  }

  disconnectClient(){
		this.socketService.disconnectClient();
	}

  playOnLine(login: string) {
    this.socketService.sendMessageToServer("on-line", login);
  }

}
