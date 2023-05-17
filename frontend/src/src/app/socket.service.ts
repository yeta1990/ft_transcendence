import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { environment } from '../environments/environment'
import { ChatMessage, SocketPayload } from '@shared/types';

export class SocketService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socket: any;
	private message = new Subject<SocketPayload>();

	constructor(namespace: string = "") {
  		this.socket = io(environment.apiUrl + namespace, 
  			{
  				auth: 
  					{token: localStorage.getItem("access_token") || "{}" }
  			})
	}

  //https://socket.io/docs/v3/emitting-events/
  //emit has two parameters:
  // - category of the message
  // - message
  //the backend will handle each message depending on its category
  // (see the chat.gateway, for insance)
  sendMessageToChat(type: string, payload: ChatMessage) {
	this.socket.emit(type, payload);
  }
 
  sendMessage(type: string, payload: string) {
	this.socket.emit(type, payload);
  }
  
  //subscription to all the kind of messages from the same listener
  // the first parameter of "on" is defined by the "event" attribute
  // in the response object of the chat.gateway
  getMessage(): Observable<SocketPayload>{
	let messageObservable: Observable<SocketPayload> = from(this.message);
	this.socket
	/*
		.onAny((event: any, data: ChatMessage) => {
			console.log(`got: ${event}`);
			this.message.next(data);
		})
		*/
		.on('message', (data: any) => {
			console.log("message received: " + data);
			this.message.next({event: 'message', data});
		})
		.on('join', (data: any) => {
			console.log("join received: " + data);
			this.message.next({event: 'join', data});
		})
		.on('listRooms', (data: any) => {
			console.log("listRooms received: " + data);
			this.message.next({event: 'listRooms', data});
		})
		
	return messageObservable;
  }
}
