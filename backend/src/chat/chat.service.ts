import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class ChatService {

	@InjectRepository(Room)
	private readonly roomRepository: Repository<Room>;

	@InjectRepository(User)
	private readonly userRepository: Repository<User>;

	constructor(private httpService: HttpService, private hashService: HashService, private userService: UserService) {}

	public async createRoom(nick:string, room: string, hasPass: boolean, password: string | undefined): Promise<boolean>{
		const roomAlreadyExists = await this.roomRepository.findOne({ where: {name: room}});

		if (roomAlreadyExists){ 
			return true;
		} else {
			const hashedPass = hasPass ? await this.hashService.hashPassword(password) : undefined;
			const user: User = await this.userService.getUserByNick(nick);
			const roomToCreate: Room = await this.roomRepository.create({
				name: room,
				hasPass: hasPass,
				password: hashedPass,
				owner: user 
			});
			const createdRoom = await this.roomRepository.save(roomToCreate);
			return false;
		}
	}

	public async isRoomCreated(name: string): Promise<boolean>{
		const foundRoom: Room | undefined = await this.roomRepository.findOne({
			where: {
				name: name,
			},
		})
		if (foundRoom != undefined)
			return true;
		return false;
	}

	public async getAllRooms(): Promise<string[]>{
		let allRooms: string[] = [];
		const foundRoomsRaw = await this.roomRepository
			.createQueryBuilder("room")
			.select("name")
			.execute()
		foundRoomsRaw.map(room => allRooms.push(room.name))
		return (allRooms);
	}

	public async deleteRoom(room: string): Promise<any>{
		return this.roomRepository.delete(room);
	}

	public async emptyTableRoom(): Promise<any>{
		return this.roomRepository.clear();
	}

	public async getHashPassFromRoom(room: string): Promise<string>{
		return this.roomRepository
			.findOne({select: {password: true }, where: {name: room}})
			.then(o => o.password);
	}

	public async isProtectedByPassword(room: string): Promise<boolean>{
		return this.roomRepository
			.findOne({select: {hasPass: true }, where: {name: room}})
			.then(o => o.hasPass);
	}

}
