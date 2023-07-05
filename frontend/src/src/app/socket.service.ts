import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { environment } from '../environments/environment'
import { ChatMessage, SocketPayload } from '@shared/types';

export class SocketService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socket: any;
	private message = new Subject<SocketPayload>();
	private messageObservable: Observable<SocketPayload> = new Observable<SocketPayload>();

	constructor(namespace: string = "") {
  		this.socket = io(environment.apiUrl + namespace, 
  			{
  				auth: 
  					{token: localStorage.getItem("access_token") || "{}" }
  			})
  		//subscription to all the kind of messages from the same listener
  		// - the first parameter of "on" is defined by the "event" attribute
  		// - in the response object of the chat.gateway
  		// 
		this.messageObservable = from(this.message);
		this.socket
			.on('message', (data: ChatMessage) => {
				console.log("message received: " + JSON.stringify(data));
				this.message.next({event: 'message', data});
			})
			.on('join', (data: any) => {
				console.log("join received: " + JSON.stringify(data));
				this.message.next({event: 'join', data});
			})
			.on('listAllRooms', (data: any) => {
				console.log("listRooms received: " + data);
				this.message.next({event: 'listAllRooms', data});
			})
			.on('listMyJoinedRooms', (data: any) => {
				console.log("listMyJoinedRooms received: " + data);
				this.message.next({event: 'listMyJoinedRooms', data});
			})
			.on('listRoomUsers', (data: any) => {
				console.log("get users in this room: " + data);
				this.message.next({event: 'listRooms', data});
			})
			.on('system', (data: ChatMessage) => {
				this.message.next({event: 'system', data});
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

  sendMessageToServer(type: string, payload: any) {
	this.socket.emit(type, payload);
  }

  getMessage(): Observable<SocketPayload>{
	return this.messageObservable;
  }
}
