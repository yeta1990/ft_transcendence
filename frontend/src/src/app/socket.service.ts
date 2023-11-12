import { Injectable, Optional } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io, Socket } from "socket.io-client";
import { events } from '@shared/const';
import { environment } from '../environments/environment'
import { ChatMessage, SocketPayload, RoomMetaData } from '@shared/types';
import { Location } from '@angular/common';
import {RoomMessages, ChatUser } from '@shared/types'

@Injectable({
  providedIn: 'root',
})

export class SocketService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

	private socket!: Socket;
	private message = new Subject<SocketPayload>();
	private messageObservable: Observable<SocketPayload> = new Observable<SocketPayload>();

	constructor(@Optional() private location: Location  ) {	}

	initializeSocket(namespace: string = "") {
		console.log(this.location.path())
		if (this.location.path().includes('callback') || this.location.path() === '/login' || this.location.path() === ''){
        } else if (this.socket == undefined){

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
//				console.log("message received: " + JSON.stringify(data));
				this.message.next({event: 'message', data});
			})
			.on('join', (data: any) => {
//				console.log("join received: " + JSON.stringify(data));
				this.message.next({event: 'join', data});
			})
			.on('joinmp', (data: any) => {
//				console.log("join private message received: " + JSON.stringify(data));
				this.message.next({event: 'joinmp', data});
			})
			.on(events.ListAllRooms, (data: Array<RoomMetaData>) => {
//				console.log("listRooms received: " + data);
				this.message.next({event: events.ListAllRooms, data});
			})
			.on(events.ListMyJoinedRooms, (data: any) => {
//				console.log("listMyJoinedRooms received: " + data);
				this.message.next({event: events.ListMyJoinedRooms, data});
			})
			.on(events.ListMyPrivateRooms, (data: any) => {
//				console.log("listMyPrivateRooms: " + data);
				this.message.next({event: events.ListMyPrivateRooms, data});
			})
			.on('listRoomUsers', (data: any) => {
//				console.log("get users in this room: " + data);
				this.message.next({event: 'listRooms', data});
			})
			.on(events.RoomMetaData, (data: RoomMetaData) => {
				this.message.next({event: events.RoomMetaData, data})
			})
			.on(events.AllRoomsMetaData, (data: Array<RoomMetaData>) => {
				this.message.next({event: events.AllRoomsMetaData, data})
			})
			.on(events.ActiveUsers, (data: Array<ChatUser>) => {
				console.log("active users")
				console.log(data)
				this.message.next({event: events.ActiveUsers, data})
//				console.log("active users: " + JSON.stringify(data));
			})
			.on(events.BlockedUsers, (data: Array<string>) => {
				this.message.next({event: events.BlockedUsers, data})
			})
			.on(events.Kicked, (data: string) => {
				this.message.next({event: events.Kicked, data})
				this.disconnectClient()
				this.forceDisconnect()
			})
			.on('system', (data: ChatMessage) => {
				this.message.next({event: 'system', data});
			})
			.on('system-error', (data: ChatMessage) => {
				this.message.next({event: 'system-error', data});
			})
			.on(events.AllHistoricalMessages, (data: any) => {
				this.message.next({event: events.AllHistoricalMessages, data});
			})
			.on(events.MessageForWebAdmins, (data: ChatMessage) => {
				console.log("message received: " + JSON.stringify(data));
				this.message.next({event: events.MessageForWebAdmins, data});
			})
		}
	}

	isConnected(): boolean {
		return this.socket && this.socket.connected;
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

  forceDisconnect(){
	if (this.socket) this.socket.disconnect();

  }

  disconnectClient(){
	if (this.socket) this.socket.emit(events.SoftDisconnect);
  }

  getMessage(): Observable<SocketPayload>{
	return this.messageObservable;
  }

  adminJoin(){
	this.socket.emit(events.AdminJoin)
  }


}
