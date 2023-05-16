import { Injectable } from '@angular/core';
import { Subject, from } from  'rxjs';
import { io } from "socket.io-client";
import { environment } from '../environments/environment'

export class SocketService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socket: any;
	private message = new Subject<string>();

	constructor(namespace: string = "") {
  		this.socket = io(environment.apiUrl + namespace, 
  						 {auth: {token: localStorage.getItem("access_token") || "{}"} })
	}

  //https://socket.io/docs/v3/emitting-events/
  //emit has two parameters:
  // - category of the message
  // - message
  //the backend will handle each message depending on its category
  // (see the chat.gateway, for insance)
  sendMessage(type: string, msg: string) {
	this.socket.emit(type, msg);
  }
 
  //subscription to all the kind of messages from the same listener
  // the first parameter of "on" is defined by the "event" attribute
  // in the response object of the chat.gateway
  getMessage(){
	let messageObservable = from(this.message);
	this.socket
		.on('message', (data: any) => {
			console.log("message: " + data);
			this.message.next(data);
		})
		.on('join', (data: any) => {
			console.log("join: " + data);
			this.message.next(data);
		})
	return messageObservable;
  }
}
