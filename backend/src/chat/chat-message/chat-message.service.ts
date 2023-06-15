import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { RoomMessages } from '@shared/types';
import { ChatMessage as ChatMessageType } from '@shared/types';

@Injectable()
export class ChatMessageService {

	@InjectRepository(ChatMessage)
	private readonly chatMessageRepository: Repository<ChatMessage>;

	public async saveMessage(message: ChatMessageType): Promise<void>{
		await this.chatMessageRepository.save(message)
	}

	public async getAllMessagesFromRoom(room: string): Promise<RoomMessages>{
		const messages: ChatMessage[] = await this.chatMessageRepository
			.find({
				where: { room: room },
				take: 100
			})
		const messagesFromRoom: RoomMessages = new RoomMessages(room, messages);
		console.log(messagesFromRoom);
		return messagesFromRoom;
	}
}
