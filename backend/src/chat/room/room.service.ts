import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '../room.entity';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { RoomMetaData } from '@shared/types';
import { ChatService } from '../chat.service';

@Injectable()
export class RoomService {
	@InjectRepository(Room)
	private readonly repository: Repository<Room>;

	constructor(private httpService: HttpService, 
				@Inject(forwardRef(() => ChatService))
				private chatService: ChatService) {}

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
				relations: ['owner', 'users', 'admins', 'banned', 'silenced'],
				where: { name: room}
			});
		return foundRoom;
	}

	public async getRoomMetaData(room: string): Promise<RoomMetaData> {
		let data: RoomMetaData = {} as RoomMetaData;
		const roomData: Room = await this.getRoom(room);
		if (!roomData)
			return data;
		data.room = room;
		data.owner = roomData.owner ? roomData.owner.nick : null;
		data.admins = [...new Set(roomData.admins.map(a => a.nick))];
		data.users = [...new Set(roomData.users.map(u => u.nick))];
		data.banned = [...new Set(roomData.banned.map(u => u.nick))];
		data.silenced = [...new Set(roomData.silenced.map(u => u.nick))];
		data.hasPass = roomData.hasPass;
		return data;
	}

	public async getAllRoomsMetaData(): Promise<Array<RoomMetaData>> {
		const allRooms: Array<string> = await this.chatService.getAllRooms();
		let allRoomsMetadata: Array<RoomMetaData> = [];
		for (const room of allRooms){
			const roomMetaData: RoomMetaData = await this.getRoomMetaData(room)
			allRoomsMetadata.push(roomMetaData)
		}
		console.log(allRoomsMetadata)
		return allRoomsMetadata
	}
}
