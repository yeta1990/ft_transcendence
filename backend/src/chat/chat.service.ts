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
		const foundUser = await this.userRepository
			.findOne({
				relations: ['joinedRooms'],
				where: { nick: nick}
			})
		if (!foundUser){
			return [];
		}
		foundUser.joinedRooms.map(r => allRooms.push(r.name))
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

	public async addUserToRoom(room: string, nick: string): Promise<boolean>{
		const isBannedOfRoom: boolean = await this.isBannedOfRoom(nick, room)
		if (isBannedOfRoom) return false;
		const foundRoom = await this.getRoom(room);
		const foundUser = await this.userService.getUserByNick(nick);
		foundRoom.users.push(foundUser);
		await this.roomRepository.save(foundRoom);
		return true;
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
		const isOwnerOfRoom: boolean = await this.isOwnerOfRoom(nick, room)
		if (isOwnerOfRoom) {
			await this.removeOwnerFromRoom(room)
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
		if (!foundRoom || !foundRoom.owner) return false;
		if (foundRoom.owner.nick === nick) return true;
		return false;
	}

	public async removeOwnerFromRoom(room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const nick: string = foundRoom.owner.nick;
		foundRoom.owner = undefined;
		await this.roomRepository.save(foundRoom);
		const user: User = await this.userService.getUserByNick(nick);
		user.ownedRooms = user.ownedRooms.filter(r => {
			return r.name != room;
		})
		await this.userRepository.save(user)
		return true;
	}

	public async makeRoomAdmin(executorNick: string, nick: string, room: string): Promise<boolean>{
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorNick, room);
		if (!executorIsOwnerOfRoom) return false;
		const isBannedOfRoom: boolean = await this.isBannedOfRoom(nick, room)
		if (isBannedOfRoom) return false;

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

	public async isAdminOfRoom(nick: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const adminsOfRoom: User[] = foundRoom.admins;
		for (let admin of adminsOfRoom){
			if (admin.nick === nick) return true;
		}
		return false;
	}

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

	// 3 user privileges: owner, admin, user
	// - owner can ban and remove ban of admins and users
	// - admins can ban and remove ban of users
	// - nobody can ban himself
	public async banUserOfRoom(executorNick: string, nick: string, room: string): Promise<boolean>{
		//check privileges
		if (executorNick === nick) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorNick, room);
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorNick, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const targetIsAlreadyBanned: boolean = await this.isBannedOfRoom(nick, room)
		if (targetIsAlreadyBanned) return true;
		const targetIsAdminOfRoom: boolean = await this.isAdminOfRoom(nick, room)
		if (executorIsAdminOfRoom && targetIsAdminOfRoom) return false;
		const targetIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(nick, room)
		if (executorIsAdminOfRoom && targetIsOwnerOfRoom) return false;
		if (executorIsOwnerOfRoom && targetIsOwnerOfRoom) return false;

		//ban
		const foundRoom: Room = await this.getRoom(room)
		if (!foundRoom) return false;
		const roomBanned: User[] = foundRoom.banned;
		for (let banned of roomBanned){
			if (banned.nick === nick) return true;
		}
		const userToBan: User | undefined = await this.userService.getUserByNick(nick);
		if (!userToBan) return false;
		foundRoom.banned.push(userToBan);
		await this.roomRepository.save(foundRoom)

		//remove user from room where has been banned
		await this.removeUserFromRoom(room, nick)
		return true;
	}

	public async isBannedOfRoom(nick: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const bannedOfRoom: User[] = foundRoom.banned;
		console.log(bannedOfRoom)
		for (let i = 0; i < bannedOfRoom.length; i++){
			if (bannedOfRoom[i].nick === nick) return true;
		}
		return false;
	}

	public async removeBanOfRoom(executorNick: string, nick: string, room: string): Promise<boolean>{
		if (executorNick === nick) return false;
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorNick, room); 
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorNick, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const isTargetBanned: boolean = await this.isBannedOfRoom(nick, room)
		if (!isTargetBanned) return true;

		const oldUserSize: number = foundRoom.users.length;
		foundRoom.banned = foundRoom.banned.filter(user => {
			return user.nick != nick;
		})
		await this.roomRepository.save(foundRoom);
		if (oldUserSize === foundRoom.users.length){ 
			return false;
		}
		return true;
	}

	async generatePrivateRoomName(originNick: string, destinationNick: string): Promise<string | undefined>{
		const originUser: User = await this.userService.getUserByNick(originNick);
		const destinationUser: User = await this.userService.getUserByNick(destinationNick);

		if (!originUser || !destinationUser){
			return undefined
		}
		const originUserId: number = originUser.id
		const destinationUserId: number = destinationUser.id
	 	if (originUserId < destinationUserId){
			return "#" + originUserId + ":" + destinationUserId;
		}
		return "#" + destinationUserId + ":" + originUserId;
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
