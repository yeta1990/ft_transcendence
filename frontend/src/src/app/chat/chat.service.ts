import { Injectable } from '@angular/core';
import { Subject, from, Observable } from  'rxjs';
import { io } from "socket.io-client";
import { events } from '@shared/const';
import { environment } from '../../environments/environment'
import { SocketService } from '../socket.service';

import { ChatMessage, SocketPayload } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
//https://auth0.com/blog/real-time-charts-using-angular-d3-and-socket-io/

//	private socketService: SocketService = new SocketService("/chat");
	constructor(private socketService: SocketService) {
	}

	forceInit() {
		if (!this.socketService.isConnected()) this.socketService.initializeSocket("/chat")
	}

	getMessage(): Observable<SocketPayload>{
		return this.socketService.getMessage();
	}

	sendMessageToChat(type: string, room: string, message: string) {
		const date: Date = new Date();
		const payloadToSend: ChatMessage = { room, message, login: "", date}
		this.socketService.sendMessageToChat(type, payloadToSend);
	}

	sendPrivateMessage(destinationLogin: string, message: string) {
		const date: Date = new Date();
		const payloadToSend: ChatMessage = { room: destinationLogin, message, login: "", date}
		this.socketService.sendMessageToChat("mp", payloadToSend);
	}

	joinUserToRoom(room: string){
		this.socketService.sendMessageToServer("join", room);
	}

	getRoomList(){
		this.socketService.sendMessageToServer(events.ListAllRooms, "");
		this.socketService.sendMessageToServer(events.ListMyJoinedRooms, "");
		this.socketService.sendMessageToServer(events.ListMyPrivateRooms, "");
	}

	partFromRoom(room: string){
		this.socketService.sendMessageToServer("part", room);
	}

	makeRoomAdmin(login: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer("admin", payloadToSend);
	}

	removeRoomAdmin(login: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer("noadmin", payloadToSend);
	}

	banUserFromRoom(login:string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer("ban", payloadToSend);
	}

	silenceUserFromRoom(login:string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.SilenceUser, payloadToSend);
	}

	unSilenceUserFromRoom(login: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.UnSilenceUser, payloadToSend);
	}

	banUser2User(targetLogin:string){
		const payloadToSend: ChatMessage = { room: targetLogin, message: "" , login: "", date: new Date() }
		this.socketService.sendMessageToServer("banuser", payloadToSend);
	}

	noBanUser2User(targetLogin:string){
		const payloadToSend: ChatMessage = { room: targetLogin, message: "" , login: "", date: new Date() }
		this.socketService.sendMessageToServer("nobanuser", payloadToSend);
	}

	removeBanFromRoom(login: string, room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer("noban", payloadToSend);
	}

	addPassToRoom(room: string, pass: string){
		const payloadToSend: ChatMessage = { room: room, message: pass, login: "", date: new Date() }
		this.socketService.sendMessageToServer(events.Pass, payloadToSend);
	}

	removePassOfRoom(room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: "", date: new Date() }
		this.socketService.sendMessageToServer(events.RemovePass, payloadToSend);
	}

	kickUser(login: string){
		this.socketService.sendMessageToServer(events.KickUser, login);
	}

	disconnectClient(){
		this.socketService.disconnectClient();
	}

	forceDisconnect() {
		this.socketService.forceDisconnect();
	}

	adminJoin() {
		this.socketService.adminJoin()
	}

	adminBanUserOfRoom(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminBanChatUser, payloadToSend);
	}

	adminRemoveBanOfRoom(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminRemoveBanChatUser, payloadToSend);
	}

	adminSilenceUserOfRoom(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminSilenceChatUser, payloadToSend);
	}

	adminRemoveSilenceUserOfRoom(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminRemoveSilenceChatUser, payloadToSend);
	}

	adminDestroyRoom(room: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: "", date: new Date() }
		this.socketService.sendMessageToServer(events.AdminDestroyChannel, payloadToSend);
	}

	adminMakeRoomAdmin(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminGiveAdminChatPrivileges, payloadToSend);
	}

	adminRevokeRoomAdmin(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminRevokeAdminChatPrivileges, payloadToSend);
	}


	adminMakeRoomOwner(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminGiveChatOwnership, payloadToSend);
	}

	adminRevokeRoomOwner(room: string, login: string){
		const payloadToSend: ChatMessage = { room: room, message: "" , login: login, date: new Date() }
		this.socketService.sendMessageToServer(events.AdminRevokeChatOwnership, room);
	}

}
