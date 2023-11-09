import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { RoomService } from './room/room.service';

import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { ChatGateway } from '../events/chat.gateway'

@Injectable()
export class ChatService {

	@InjectRepository(Room)
	private readonly roomRepository: Repository<Room>;

	@InjectRepository(User)
	private readonly userRepository: Repository<User>;

	constructor(private httpService: HttpService, private hashService: HashService, private userService: UserService, 
				@Inject(forwardRef(() => RoomService))
				private roomService: RoomService,
				@Inject(forwardRef(() => ChatGateway))
				private chatGateway: ChatGateway
			   ) {}

	public async createRoom(login: string, room: string, hasPass: boolean, password: string | undefined): Promise<boolean>{
		const roomAlreadyExists = await this.roomRepository.findOne({ where: {name: room}});

		if (roomAlreadyExists){ 
			return true; 
		} else { 
			const hashedPass = hasPass ? await this.hashService.hashPassword(password) : undefined;
			const user: User = await this.userService.getUserByLogin(login);
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

	public async getRoomMaskOfPrivateRoom(room: string, myLogin: string): Promise<string>{
		if (room.includes(":")){
			const userIds: Array<number> = room
				.replace("#", "")
				.split(":")
				.map(n => parseInt(n));
			const user1: User = await this.userService.getUser(userIds[0])
			const user2: User = await this.userService.getUser(userIds[1])
			if (user1.login === myLogin && user2){
				return "@" + user2.login
			}
			return "@" + user1.login
		}
		return room
	}

	public async getAllRooms(): Promise<string[]>{
		let allRooms: string[] = [];

		const foundRoomsRaw = await this.roomRepository
			.createQueryBuilder("room")
			.select("name")
			.execute()
		foundRoomsRaw.map(room => room.name.includes(":") ? undefined : allRooms.push(room.name))
		return (allRooms);
	}

	public async getMyPrivateRooms(login: string): Promise<string []>{
		const allMyJoinedRooms: Array<string> = await this.getAllJoinedRoomsByOneUser(login)
		return allMyJoinedRooms.filter(r => r.includes("@"))
	}

	public async getAllJoinedRoomsByOneUser(login: string): Promise<string[]>{
		let allRooms: string[] = [];
		const foundUser = await this.userRepository
			.findOne({
				relations: ['joinedRooms'],
				where: { login: login}
			})
		if (!foundUser){
			return [];
		}
		const joinedRoomsRaw = foundUser.joinedRooms;
		for (let i = 0; i < joinedRoomsRaw.length; i++){
			if (joinedRoomsRaw[i].name.includes(":")){
				allRooms.push(await this.getRoomMaskOfPrivateRoom(joinedRoomsRaw[i].name, login))
			}
			else{
				allRooms.push(joinedRoomsRaw[i].name)
			}
		}
		return (allRooms);
	}

	public async getRoom(room: string): Promise<Room>{
		return await this.roomService.getRoom(room)
	}

	public async addUserToRoom(room: string, login: string): Promise<boolean>{
		const isBannedOfRoom: boolean = await this.isBannedOfRoom(login, room)
		if (isBannedOfRoom) return false;
		const foundRoom = await this.getRoom(room);
		const foundUser = await this.userService.getUserByLogin(login);
		foundRoom.users.push(foundUser);
		await this.roomRepository.save(foundRoom);
		return true;
	}

	public async removeUserFromRoom(room: string, login: string): Promise<boolean> {
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) { return false; }
		const oldUserSize: number = foundRoom.users.length;
		foundRoom.users = foundRoom.users.filter(user => {
			return user.login != login;
		})
		await this.roomRepository.save(foundRoom);
		const isOwnerOfRoom: boolean = await this.isOwnerOfRoom(login, room)
		if (isOwnerOfRoom) {
			await this.removeOwnerFromRoom(room)
		}
		const isAdminOfRoom: boolean = await this.isAdminOfRoom(login, room)
		if (isAdminOfRoom) {
			await this.forceRemoveRoomAdmin(login, room)
		}
		if (!isOwnerOfRoom && !isAdminOfRoom && oldUserSize === foundRoom.users.length){ 
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
			usersRaw.map(u => allUsersInRoom.push(u.login))
		}
		return allUsersInRoom;
	}

	public async isUserInRoom(room: string, login: string): Promise<boolean>{
		const usersInRoom: string[] = await this.getAllUsersInRoom(room);
		if (!usersInRoom) return false;
		return usersInRoom.includes(login);
	}

	public async isRoomEmpty(room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		if (foundRoom.users.length === 0){
			return (true)
		}
		return (false)
	}

	public async isOwnerOfRoom(login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom || !foundRoom.owner) return false;
		if (foundRoom.owner.login === login) return true;
		return false;
	}

	public async removeOwnerFromRoom(room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom || !foundRoom.owner) return false;
		const login: string = foundRoom.owner.login;
		foundRoom.owner = undefined;
		await this.roomRepository.save(foundRoom);
		const user: User = await this.userService.getUserByLogin(login);
		user.ownedRooms = user.ownedRooms.filter(r => {
			return r.name != room;
		})
		await this.userRepository.save(user)
		return true;
	}

	public async makeRoomAdmin(executorLogin: string, login: string, room: string): Promise<boolean>{
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room);
		if (!executorIsOwnerOfRoom) return false;
		const isBannedOfRoom: boolean = await this.isBannedOfRoom(login, room)
		if (isBannedOfRoom) return false;

		const foundRoom: Room = await this.getRoom(room)
		const roomAdmins: User[] = foundRoom.admins;
		for (let admin of roomAdmins){
			if (admin.login === login) return false;
		}
		const userToMakeAdmin: User | undefined = await this.userService.getUserByLogin(login);
		if (!userToMakeAdmin) return false;
		foundRoom.admins.push(userToMakeAdmin);
		await this.roomRepository.save(foundRoom)
		return true;
	}

	public async isAdminOfRoom(login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const adminsOfRoom: User[] = foundRoom.admins;
		for (let admin of adminsOfRoom){
			if (admin.login === login) return true;
		}
		return false;
	}

	public async removeRoomAdmin(executorLogin: string, login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const isOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room);
		if (!isOwnerOfRoom) return false;
		const oldAdminSize: number = foundRoom.admins.length;
		foundRoom.admins = foundRoom.admins.filter(user => {
			return user.login != login;
		})
		await this.roomRepository.save(foundRoom);
		if (oldAdminSize === foundRoom.admins.length){ 
			return false;
		}
		return true;
	}

	public async forceRemoveRoomAdmin(login: string, room:string) {
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;

		const oldAdminSize: number = foundRoom.admins.length;
		foundRoom.admins = foundRoom.admins.filter(user => {
			return user.login != login;
		})
		await this.roomRepository.save(foundRoom);
		if (oldAdminSize === foundRoom.admins.length){ 
			return false;
		}
		return true;
	}

	// 3 user privileges: owner, admin, user
	// - owner can ban and remove ban of admins and users
	// - admins can ban and remove ban of users
	// - nobody can ban himself
	public async banUserOfRoom(executorLogin: string, login: string, room: string): Promise<boolean>{
		//check privileges
		if (executorLogin === login) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room);
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorLogin, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const targetIsAlreadyBanned: boolean = await this.isBannedOfRoom(login, room)
		if (targetIsAlreadyBanned) return false;
		const targetIsAdminOfRoom: boolean = await this.isAdminOfRoom(login, room)
		const targetIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(login, room)
		if (executorIsAdminOfRoom && targetIsOwnerOfRoom) return false;
		if (executorIsOwnerOfRoom && targetIsOwnerOfRoom) return false;

		//remove privileges and ban
		await this.removeRoomAdmin(executorLogin, login, room);
		const foundRoom: Room = await this.getRoom(room)
		if (!foundRoom) return false;
		const roomBanned: User[] = foundRoom.banned;
		for (let banned of roomBanned){
			if (banned.login === login) return true;
		}
		const userToBan: User | undefined = await this.userService.getUserByLogin(login);
		if (!userToBan) return false;
		foundRoom.banned.push(userToBan);
		await this.roomRepository.save(foundRoom)

		//remove user from room where has been banned
		return await this.removeUserFromRoom(room, login)
	}

	public async isBannedOfRoom(login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const bannedOfRoom: User[] = foundRoom.banned;
		for (let i = 0; i < bannedOfRoom.length; i++){
			if (bannedOfRoom[i].login === login) return true;
		}
		return false;
	}

	public async removeBanOfRoom(executorLogin: string, login: string, room: string): Promise<boolean>{
		if (executorLogin === login) return false;
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room); 
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorLogin, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const isTargetBanned: boolean = await this.isBannedOfRoom(login, room)
		if (!isTargetBanned) return false;

		const oldBannedSize: number = foundRoom.banned.length;
		foundRoom.banned = foundRoom.banned.filter(user => {
			return user.login != login;
		})
		await this.roomRepository.save(foundRoom);
		if (oldBannedSize === foundRoom.banned.length){ 
			return false;
		}
		return true;
	}

	public async silenceUserOfRoom(executorLogin: string, login: string, room: string): Promise<boolean>{
		//check privileges
		if (executorLogin === login) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room);
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorLogin, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const targetIsAlreadySilenced: boolean = await this.isSilencedOfRoom(login, room)
		if (targetIsAlreadySilenced) return false;
		const targetIsAdminOfRoom: boolean = await this.isAdminOfRoom(login, room)
		const targetIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(login, room)
		if (executorIsAdminOfRoom && targetIsOwnerOfRoom) return false;
		if (executorIsOwnerOfRoom && targetIsOwnerOfRoom) return false;

		//remove privileges and ban
		const foundRoom: Room = await this.getRoom(room)
		if (!foundRoom) return false;
		const roomSilenced: User[] = foundRoom.silenced;
		for (let silenced of roomSilenced){
			if (silenced.login === login) return true;
		}
		const userToSilence: User | undefined = await this.userService.getUserByLogin(login);
		if (!userToSilence) return false;
		foundRoom.silenced.push(userToSilence);
		await this.roomRepository.save(foundRoom)

		return true;
	}

	public async removeSilenceOfRoom(executorLogin: string, login: string, room: string): Promise<boolean>{
		if (executorLogin === login) return false;
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(executorLogin, room); 
		const executorIsAdminOfRoom: boolean = await this.isAdminOfRoom(executorLogin, room);
		if (!executorIsOwnerOfRoom && !executorIsAdminOfRoom) return false;
		const isTargetSilenced: boolean = await this.isSilencedOfRoom(login, room)
		if (!isTargetSilenced) return false;

		const oldSilencedSize: number = foundRoom.users.length;
		foundRoom.silenced = foundRoom.silenced.filter(user => {
			return user.login != login;
		})
		await this.roomRepository.save(foundRoom);
		if (oldSilencedSize === foundRoom.silenced.length){ 
			return false;
		}
		return true;
	}


	public async isSilencedOfRoom(login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const silencedOfRoom: User[] = foundRoom.silenced;
		for (let i = 0; i < silencedOfRoom.length; i++){
			if (silencedOfRoom[i].login === login) return true;
		}
		return false;
	}

	public async addPassToRoom(login: string, room: string, pass: string){
		if (pass.trim().length === 0) return
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(login, room); 
		if (!executorIsOwnerOfRoom) return false;
		const hashedPass = await this.hashService.hashPassword(pass);
		foundRoom.hasPass = true;
		foundRoom.password = hashedPass
		await this.roomRepository.save(foundRoom)
		return true
	}

	public async removePassOfRoom(login: string, room: string){
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const executorIsOwnerOfRoom: boolean = await this.isOwnerOfRoom(login, room); 
		if (!executorIsOwnerOfRoom) return false;
		foundRoom.hasPass = false;
		foundRoom.password = null;
		await this.roomRepository.save(foundRoom)
		return true
	}


	async generatePrivateRoomName(originLogin: string, destinationLogin: string): Promise<string | undefined>{
		const originUser: User = await this.userService.getUserByLogin(originLogin);
		const destinationUser: User = await this.userService.getUserByLogin(destinationLogin);

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

	public async banUser2User(emisorLogin: string, targetLogin: string): Promise<boolean>{

		const bannedUsers = await this.userService.getBannedUsersByLogin(emisorLogin)
		// check if user is already banned
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].login == targetLogin) return true;
		}
		const foundEmisor = await this.userService.getUserByLogin(emisorLogin);
		if (foundEmisor === undefined) 
			return false
		const foundTarget = await this.userService.getUserByLogin(targetLogin);
		if (foundTarget === undefined)
			return false
		foundEmisor.bannedUsers.push(foundTarget)
		await this.userRepository.save(foundEmisor)
		await this.chatGateway.sendBlockedUsers(emisorLogin)
		return true
	}

	public async noBanUser2User(emisorLogin: string, targetLogin: string): Promise<boolean>{
		let foundEmisor = await this.userService.getUserByLogin(emisorLogin);
		if (foundEmisor === undefined) 
			return false
		const newBannedUsers: Array<User> = foundEmisor.bannedUsers.filter(u => u.login !== targetLogin)
		if (foundEmisor.bannedUsers.length === newBannedUsers.length) return false;
		foundEmisor.bannedUsers = newBannedUsers;
		await this.userRepository.save(foundEmisor)
		await this.chatGateway.sendBlockedUsers(emisorLogin)
		return true
	}

	public async deleteRoom(room: string): Promise<any>{
		return await this.roomRepository.delete(room);
	}

	//only for testing purposes
	public async emptyTableRoom(): Promise<any>{
		return await this.roomRepository.clear();
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
