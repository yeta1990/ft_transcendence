import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '../room.entity';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
	@InjectRepository(Room)
	private readonly repository: Repository<Room>;

	constructor(private httpService: HttpService) {}

	public async isRoomCreated(name: string): Promise<boolean>{
		const foundRoom: Room | undefined = await this.repository.findOne({
			where: {
				name: name,
			},
		})
		if (foundRoom != undefined)
			return true;
		return false;
	}

}
