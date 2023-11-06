import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Room } from '../room.entity';
import { RoomService } from '../room/room.service';
import {ChatService} from '../chat.service'

@Injectable()
export class ChatAdminService {

	@InjectRepository(Room)
	private readonly roomRepository: Repository<Room>;

	@InjectRepository(User)
	private readonly userRepository: Repository<User>;

	constructor(private chatService: ChatService, private httpService: HttpService, private userService: UserService, 
				@Inject(forwardRef(() => RoomService))
				private roomService: RoomService) {}


	public async banUserOfRoom(executorLogin: string, login: string, room: string): Promise<boolean>{
		const targetIsWebOwner: boolean = await this.userService.isWebOwner(login)
		if (targetIsWebOwner) return false;
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

		//remove user, owner and admin of the room, if proceed
		return await this.chatService.removeUserFromRoom(room, login)
	}

	public async removeBanOfRoom(executorLogin: string, login: string, room:string): Promise<boolean> {
		const foundRoom: Room = await this.roomService.getRoom(room);
		if (!foundRoom) return false;
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

		const isTargetBanned: boolean = await this.chatService.isBannedOfRoom(login, room)
		if (!isTargetBanned) return false;

		const oldBannedSize: number = foundRoom.users.length;
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
		const targetIsWebOwner: boolean = await this.userService.isWebOwner(login)
		if (targetIsWebOwner) return false;
		const foundRoom: Room = await this.roomService.getRoom(room);
		if (!foundRoom) return false;
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

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
		const foundRoom: Room = await this.roomService.getRoom(room);
		if (!foundRoom) return false;
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

		const isTargetSilenced: boolean = await this.chatService.isSilencedOfRoom(login, room)
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

	public async destroyRoom(executorLogin: string, room: string): Promise<any>{
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

		return this.roomRepository.delete(room);
	}

	public async makeRoomAdmin(executorLogin: string, login: string, room: string): Promise<boolean>{
		const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
		if (!executorIsWebAdmin) return false;

		const isBannedOfRoom: boolean = await this.chatService.isBannedOfRoom(login, room)
		if (isBannedOfRoom) return false;

		const foundRoom: Room = await this.chatService.getRoom(room)
		if (!foundRoom) return false;
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

	public async giveChatOwnerPrivileges(executorLogin: string, login: string, room: string): Promise<boolean>{
  	  const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
	  if (!executorIsWebAdmin) return false;
	  const foundRoom: Room = await this.chatService.getRoom(room)
	  if (!foundRoom) return false;
	  await this.chatService.removeOwnerFromRoom(room)
	  const newOwner: User = await this.userService.getUserByLogin(login)
	  if (!newOwner) return false;
	  foundRoom.owner = newOwner;
	  await this.roomRepository.save(foundRoom)
	  return true;
	}


	public async removeOwnerFromRoom(executorLogin: string, room: string): Promise<boolean>{
	  const foundRoom: Room = await this.chatService.getRoom(room)
	  if (!foundRoom || !foundRoom.owner) return false;

	  const targetIsWebOwner: boolean = await this.userService.isWebOwner(foundRoom.owner.login)
	  if (targetIsWebOwner && foundRoom.owner.login != executorLogin) return ;
	  const executorIsWebAdmin: boolean = await this.userService.hasAdminPrivileges(executorLogin)
	  if (!executorIsWebAdmin) return ;
	  return await this.chatService.removeOwnerFromRoom(room)
	}
	//GiveChatOwnerPrivileges
	//RevokeChatOwnerPrivileges


}
