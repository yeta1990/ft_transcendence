import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '../room.entity';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { RoomMetaData } from '@shared/types';

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

	public async getRoom(room: string): Promise<Room>{
		const foundRoom = await this.repository
			.findOne({
				relations: ['owner', 'users', 'admins', 'banned'],
				where: { name: room}
			});
		return foundRoom;
	}

	public async getRoomMetaData(room: string): Promise<RoomMetaData> {
		let data: RoomMetaData = {} as RoomMetaData;
		const roomData: Room = await this.getRoom(room);
		data.room = room;

		data.owner = roomData.owner ? roomData.owner.nick : null;
		data.admins = [...new Set(roomData.admins.map(a => a.nick))];
		data.users = [...new Set(roomData.users.map(u => u.nick))];
		console.log(data)
		return data;
	}
}
