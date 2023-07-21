import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { RoomMessages } from '@shared/types';
import { ChatMessage as ChatMessageType } from '@shared/types';
import { DataSource } from "typeorm"

@Injectable()
export class ChatMessageService {

	@InjectRepository(ChatMessage)
	private readonly chatMessageRepository: Repository<ChatMessage>;

//	constructor(private readOnly chatMessageRepository: ChatMessage)
	public async saveMessage(message: ChatMessageType): Promise<void>{
		await this.chatMessageRepository.save(message)
	}

	public async getAllMessagesFromRoom(room: string): Promise<RoomMessages>{
		const messages: any[] = await this
			.chatMessageRepository
			.createQueryBuilder()
			.where('"roomName"= :room', {room})
			.orderBy({"date": "DESC"})
			.limit(200)
			.getMany()
		//trick because column roomName is conflictive
		messages.map(m => m.room = room);
		const messagesFromRoom: RoomMessages = new RoomMessages(room, messages.reverse());
		return messagesFromRoom;
	}
}
