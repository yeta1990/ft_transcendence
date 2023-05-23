import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import { Repository } from 'typeorm';
import { Room } from './room.entity';

@Injectable()
export class ChatService {

	@InjectRepository(Room)
	private readonly repository: Repository<Room>;

	constructor(private httpService: HttpService, private hashService: HashService) {}

	public async createRoom(room: string, hasPass: boolean, password: string | undefined): Promise<Room>{
		const roomAlreadyExists = await this.repository.findOne({ where: {name: room}});

		if (roomAlreadyExists){ 
			Promise.resolve() 
		} else {
			const hashedPass = hasPass ? await this.hashService.hashPassword(password) : undefined;
			const roomToCreate: Room = this.repository.create({
				name: room, 
				hasPass: hasPass,
				password: hashedPass
			}); 
			return this.repository.save(roomToCreate);
		}
	}

	public async deleteRoom(room: string): Promise<any>{
		return this.repository.delete(room);
	}

	public async emptyTableRoom(): Promise<any>{
		return this.repository.clear();
	}

}
