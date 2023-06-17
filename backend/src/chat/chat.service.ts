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
				owner: user,
				users: [user]
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

	public async getAllJoinedRoomsByOneUser(nick: string): Promise<string[]>{
		let allRooms: string[] = [];
		const foundRoomsRaw = await this.userRepository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.joinedRooms", "room")
			.getOne()

		foundRoomsRaw.joinedRooms.map(r => allRooms.push(r.name))
		return (allRooms);
	}

	public async getRoom(room: string): Promise<Room>{
		const foundRoom = await this.roomRepository
			.findOne({
				relations: ['owner', 'users', 'admins', 'banned'],
				where: { name: room}
			});
		return foundRoom;
	}

	public async addUserToRoom(room: string, nick: string): Promise<void>{
		const foundRoom = await this.getRoom(room);
		const foundUser = await this.userService.getUserByNick(nick);
		foundRoom.users.push(foundUser);
		await this.roomRepository.save(foundRoom);
	}

	public async removeUserFromRoom(room: string, nick: string): Promise<boolean> {
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) { return false; }
		const oldUserSize: number = foundRoom.users.length;
		foundRoom.users = foundRoom.users.filter(user => {
			return user.nick != nick;
		})
		await this.roomRepository.save(foundRoom);
		if (oldUserSize === foundRoom.users.length){ 
			return false;
		}
		return true;
	}

	public async getAllUsersInRoom(room: string): Promise<string[]>{
		let allUsersInRoom: string[] = [];
		const usersRaw = await this.roomRepository
			.findOne({
				relations: ['users'],
				where: { name: room} 
			})
			.then(r => r ? r.users : null )
		if (usersRaw){
			usersRaw.map(u => allUsersInRoom.push(u.nick))
		}
		return allUsersInRoom;
	}

	public async isUserInRoom(room: string, nick: string): Promise<boolean>{
		const usersInRoom: string[] = await this.getAllUsersInRoom(room);
		return usersInRoom.includes(nick);
	}

	public async isRoomEmpty(room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (foundRoom.users.length === 0){
			return (true)	
		}
		return (false)
	}

	public async isOwnerOfRoom(nick: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
//		console.log("found room " + room)
//		console.log(foundRoom)
		if (foundRoom.owner.nick === nick) return true;
		return false;
	}

	public async makeRoomAdmin(executorNick: string, nick: string, room: string): Promise<boolean>{
		const isOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorNick, room);
		if (!isOwnerOfRoom) return false;

		// isBanned(nick, room)
		// if is banned, return false
		//

		const foundRoom: Room = await this.getRoom(room)
		const roomAdmins: User[] = foundRoom.admins;
		for (let admin of roomAdmins){
			if (admin.nick === nick) return true;
		}
		const userToMakeAdmin: User | undefined = await this.userService.getUserByNick(nick);
		if (!userToMakeAdmin) return false;
		foundRoom.admins.push(userToMakeAdmin);
		await this.roomRepository.save(foundRoom)
		return true;
	}

	//isAdminOfRoom(nick: string, room: string)

	public async removeRoomAdmin(executorNick: string, nick: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const isOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorNick, room);
		if (!isOwnerOfRoom) return false;
		const oldUserSize: number = foundRoom.users.length;
		foundRoom.admins = foundRoom.admins.filter(user => {
			return user.nick != nick;
		})
		await this.roomRepository.save(foundRoom);
		if (oldUserSize === foundRoom.users.length){ 
			return false;
		}
		return true;
	}





	public async deleteRoom(room: string): Promise<any>{
		return this.roomRepository.delete(room);
	}

	//only for testing purposes
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
