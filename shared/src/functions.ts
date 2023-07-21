
import { ChatMessage } from '@shared/types';

export function generateJoinResponse(room: string): ChatMessage{
	const response: ChatMessage = {
		room: room,
		message: `you are in room ${room}`,
		nick: "system",
		date: new Date()
	}
	return response;
}

export function generateSocketErrorResponse(room: string, message: string): any {
	const response: ChatMessage = {
		room: room,
		message: message,
		nick: "system",
		date: new Date()
	}
   	return { event: 'system', data: response};
}

export function generateSocketInformationResponse(room: string, message: string): any {
	const response: ChatMessage = {
		room: room,
		message: message,
		nick: "system",
		date: new Date()
	}
   	return { event: 'system', data: response};
}
