import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

//https://github.com/rodgc/ngx-socket-io/issues/25#issuecomment-479936465
  constructor(private socket: Socket) { 
	this.socket.ioSocket.nsp = '/chat'
  }

  sendMessage(msg: string) {
	this.socket.emit('message', msg);
  }
 
  getMessage(){
	return this.socket
		.fromEvent('message')
		.pipe(map((data: any) => {console.log(data.msg); return data.msg}))
  }

}
