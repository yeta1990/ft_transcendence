
import { ChatMessage } from '@shared/types';
import { EloRank } from '@shared/enum';

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

export function calculateElo(oldElo: number, K: number, W: number, L: number, Di: number): number {
	const Ei = 1 / (1 + Math.pow(10, (Di - oldElo) / 400));
	const newElo = oldElo + (K / 2) * (W - L + 0.5 * (Ei - Di) / 200);
	return Math.round(newElo);
}

export function getEloRank(elo: number): string {
	if (elo < EloRank.Aficionado) {
	  return 'Principiante';
	} else if (elo < EloRank.Intermedio) {
	  return 'Aficionado';
	} else if (elo < EloRank.Avanzado) {
	  return 'Intermedio';
	} else if (elo < EloRank.Experto) {
	  return 'Avanzado';
	} else if (elo < EloRank.Maestro) {
	  return 'Experto';
	} else {
	  return 'Maestro';
	}
  }