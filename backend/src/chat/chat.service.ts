import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Room } from './room.entity';

@Injectable()
export class ChatService {

	@InjectRepository(Room)
	private readonly repository: Repository<Room>;

	constructor(private httpService: HttpService) {}

	public async createRoom(room: string, hasPass: boolean, password: string): Promise<Room>{
		const roomAlreadyExists = await this.repository.findOne({ where: {name: room}});

		if (roomAlreadyExists){ 
			Promise.resolve() 
		} else {
			const roomToCreate: Room = this.repository.create(
				{name: room, hasPass: hasPass, password: password}
			);
			return this.repository.save(roomToCreate);
		}
	}

	public async deleteRoom(room: string): Promise<any>{
		await this.repository.delete(room);
	}

}
