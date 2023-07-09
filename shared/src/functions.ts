
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
