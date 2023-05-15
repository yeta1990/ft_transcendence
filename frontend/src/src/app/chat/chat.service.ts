import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

//https://github.com/rodgc/ngx-socket-io/issues/25#issuecomment-479936465
  constructor(private socket: Socket) { 
  	//defining namespace where this socket client will listen to
	this.socket.ioSocket.nsp = '/chat'
  }

  //emit has two parameters:
  // - category of the message
  // - message
  //the backend will handle each message depending on its category
  // (see the chat.gateway, for insance)
  sendMessage(msg: string) {
	this.socket.emit('message', msg);
  }
 
  getMessage(){
	return this.socket
		.fromEvent('message')
		.pipe(map((data: any) => data))
  }

}
