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

	public async createRoom(room: string, hasPass: boolean, password: string | undefined): Promise<boolean>{
		const roomAlreadyExists = await this.repository.findOne({ where: {name: room}});

		if (roomAlreadyExists){ 
			return true;
		} else {
			const hashedPass = hasPass ? await this.hashService.hashPassword(password) : undefined;
			const roomToCreate: Room = await this.repository.create({
				name: room,
				hasPass: hasPass,
				password: hashedPass
			});
			await this.repository.save(roomToCreate);
			return false;
		}
	}

	public async deleteRoom(room: string): Promise<any>{
		return this.repository.delete(room);
	}

	public async emptyTableRoom(): Promise<any>{
		return this.repository.clear();
	}

	public async getHashPassFromRoom(room: string): Promise<string>{
		return this.repository
			.findOne({select: {password: true }, where: {name: room}})
			.then(o => o.password);
	}

	public async isProtectedByPassword(room: string): Promise<boolean>{
		return this.repository
			.findOne({select: {hasPass: true }, where: {name: room}})
			.then(o => o.hasPass);
	}

}
