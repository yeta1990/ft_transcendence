import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ChatService } from '../chat.service'

@Injectable()
export class TasksService {
	constructor(private chatService: ChatService) {

	}

	@Interval(30000)
	handleInterval() {
		this.chatService.emitUpdateUsersAndRoomsMetadata()
		console.log(new Date());
	}


}
