
export type ChatMessage = {
	room: string;
	message: string;
}

export type SocketPayload = {
	event: string;
	data: string;
}
