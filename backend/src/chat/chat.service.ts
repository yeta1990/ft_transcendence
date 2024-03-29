import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { RoomService } from './room/room.service';
import {ChatUser, GameRoom} from '@shared/types'
import {UserStatus} from '@shared/enum'
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { ChatGateway } from '../events/chat.gateway'
import { BehaviorSubject, Observable } from 'rxjs';
import { Game } from '../pong/game.entity'
import {Silenced } from '@shared/types'
import {addMinutes} from '@shared/functions'

@Injectable()
export class ChatService {

	users: Map<string, ChatUser> = new Map();
	trigger: Date = new Date();
    private triggerSubject: BehaviorSubject<Date> = new BehaviorSubject(this.trigger);



	@InjectRepository(User)
	private readonly userRepository: Repository<User>;

	@InjectRepository(Game)
	private readonly gameRepository: Repository<Game>;

	constructor(private httpService: HttpService, private hashService: HashService, private userService: UserService, 
				@Inject(forwardRef(() => RoomService))
				private roomService: RoomService,
				@Inject(forwardRef(() => ChatGateway))
				private chatGateway: ChatGateway,
				@InjectRepository(Room)
				private readonly roomRepository: Repository<Room>
			   ) {
			this.deleteAllGameRooms()
			   }
 
	getUsersObservable(): Observable<Date>{
			return this.triggerSubject
	}

	addChatUser(socket_id: string, user: ChatUser){
		this.users.set(socket_id, user)
		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}

	setAllChatUsers(allChatUsers: Map<string, ChatUser>) {
		this.users = allChatUsers;
		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}

	getAllChatUsers(): Map<string, ChatUser> {
		return this.users;
	}

	getChatUserBySocketId(socket_id: string): ChatUser {
		return this.users.get(socket_id)
	}

	deleteChatUserBySocketId(socket_id: string): void {
		this.users.delete(socket_id)
		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}
  
	setUserStatusIsPlaying(login: string):void {
		this.users.forEach((chatUser: ChatUser, key: string) => {
  			if (chatUser.login === login) {
    			chatUser.status = UserStatus.PLAYING;
  			}
		});

		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}

	setUserStatusIsActive(login: string):void {
		this.users.forEach((chatUser: ChatUser, key: string) => {
  			if (chatUser.login === login) {
    			chatUser.status = UserStatus.ONLINE;
  			}
		});
		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}

	editActiveUser(newUser: User): void {
		this.users.forEach((chatUser: ChatUser, key: string) => {
  			if (chatUser.login === newUser.login) {
    			chatUser.nick = newUser.nick;
  			}
		});
		this.chatGateway.emitUpdateUsersAndRoomsMetadata() 
	}

	isAvailableToPlay(targetLogin: string): boolean{
		let available: boolean = false;
		this.users.forEach((chatUser: ChatUser, key: string) => {
  			if (chatUser.login === targetLogin && chatUser.status == UserStatus.ONLINE) {
				available = true;
  			}
		});
		return available;
	}

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

	public async getMyPrivateRooms(login: string): Promise<any []>{
		const allMyJoinedRooms: Array<string> = await this.getAllJoinedRoomsByOneUser(login)
		const myPrivateRoomsList = allMyJoinedRooms.filter(r => r.includes("@"))
		const myPrivateRooms: Array<any> = []
		const allUsers: User[] = await this.userService.getAllUsers()
			myPrivateRoomsList.map(r => { 
				const privateRoom = {
					room: r, 
					nick: allUsers.find(u => r.substr(1) === u.login).nick
				}
				myPrivateRooms.push(privateRoom)
			})
		return myPrivateRooms
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
		if (!foundRoom) return false;
		const foundUser = await this.userService.getUserByLogin(login);
		if (!foundUser) return false;
		for (let user of foundRoom.users){
			if (user.login == login) return true;
		}
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

	public async silenceUserOfRoom(executorLogin: string, login: string, room: string, time:number): Promise<boolean>{
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
		let roomSilenced: Silenced[] = foundRoom.silenced;
		if (!roomSilenced) {roomSilenced = []}
		for (let silenced of roomSilenced){
			if (silenced.login === login) return true;
		}
		const user: User | undefined = await this.userService.getUserByLogin(login);
		if (!user) return false;
		if (time < 1 || time > 1000) return false;
		const userToSilence: Silenced = { login: login, until: addMinutes(time) }
		if (!foundRoom.silenced) foundRoom.silenced = [] as Silenced[]
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
		if (!isTargetSilenced) return true;

		const oldSilencedSize: number = foundRoom.users.length;

		foundRoom.silenced = foundRoom.silenced.filter((silenced: any) => !silenced.includes(login))
		await this.roomRepository.save(foundRoom);
		if (oldSilencedSize === foundRoom.silenced.length){ 
			return false;
		}
		return true;
	}

	public async isSilencedOfRoom(login: string, room: string): Promise<boolean>{
		const foundRoom: Room = await this.getRoom(room);
		if (!foundRoom) return false;
		const silencedOfRoom: Silenced[] = foundRoom.silenced;
		if (!silencedOfRoom) return false;
		let silenced: boolean = false;
		foundRoom.silenced.map((u: any) => {
			if (JSON.parse(u).login == login && new Date(JSON.parse(u).until) > new Date()) silenced = true}
		);
		return silenced;
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

	public emitUpdateUsersAndRoomsMetadata(){
		this.chatGateway.emitUpdateUsersAndRoomsMetadata();
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

		if (emisorLogin == targetLogin) return false;
		const bannedUsers = await this.userService.getBannedUsersByLogin(emisorLogin)
		// check if user is already banned
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].login == targetLogin) return true;
		}
		const foundEmisor = await this.userService.getUserByLogin(emisorLogin);
		if (foundEmisor === undefined) return false
		const foundTarget = await this.userService.getUserByLogin(targetLogin);
		if (foundTarget === undefined) return false
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

	public async deleteAllGameRooms(): Promise<any>{
		return await this.roomRepository
      		.createQueryBuilder()
      		.delete()
      		.from(Room)
      		.where("name LIKE :name", { name: '%pongRoom%' })
      		.execute();
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

	public calcularNuevoElo(eloJugador1, eloJugador2, resultadoJugador1): any{
		const kFactor = 32;

		if (isNaN(eloJugador1) || isNaN(eloJugador2) || isNaN(resultadoJugador1)) {
		  }
		  if (resultadoJugador1 < 0 || resultadoJugador1 > 1) {
		  }

		const expectedPlayer1 = 1 / (1 + Math.pow(10, (eloJugador2 - eloJugador1) / 400))
		const expectedPlayer2 = 1 / (1 + Math.pow(10, (eloJugador1 - eloJugador2) / 400))

		const nuevoEloJugador1 = Math.round(eloJugador1 + kFactor * (resultadoJugador1 - expectedPlayer1))
		const nuevoEloJugador2 = Math.round(eloJugador2 + kFactor * ((1 - resultadoJugador1) - expectedPlayer2))

		if (isNaN(nuevoEloJugador1) || isNaN(nuevoEloJugador2)) {
		  }

		return {nuevoEloJugador1, nuevoEloJugador2}
			
	}
	private calculateResultForelo(playerOneScore, playerTwoScore):number { 
			if (playerOneScore > playerTwoScore) return 1
			else if (playerOneScore < playerTwoScore) return 0
			else return 0.5
	}



	public async saveGameResult(g: GameRoom){
		if (g.powersAllow) return;
		const user1: User = await this.userService.getUserByLogin(g.playerOne)
		const user2: User = await this.userService.getUserByLogin(g.playerTwo)
		if (!user1 || !user2 || g.playerOne == "" || g.playerTwo == "") return;
		const result = {
			"player1": g.playerOne,
			"player2": g.playerTwo,
			"player1Points": g.playerOneScore,
			"player2Points": g.playerTwoScore,
		}
		await this.gameRepository.save(result)
		const resultForelo = this.calculateResultForelo(g.playerOneScore, g.playerTwoScore)
		const newElos = this.calcularNuevoElo(user1.elo, user2.elo, resultForelo)
		user1.elo = newElos.nuevoEloJugador1
		user2.elo = newElos.nuevoEloJugador2

		if (resultForelo === 1){
			if (user1.wins === 0){
				const debutAchievement = await this.userService.getAchievementByName('Grand Debut')
				user1.achievements.push(debutAchievement)
			}
			if (g.playerOneScore == 5 && g.playerTwoScore == 0){
				const flawlessAchievement = await this.userService.getAchievementByName('Flawless Victory')
				user1.achievements.push(flawlessAchievement)
				
			}
			user1.wins += 1;
			user1.winningStreak +=1;
			if (user1.winningStreak >= 5){
				const risingStarAchievement = await this.userService.getAchievementByName('Rising Star')
				user1.achievements.push(risingStarAchievement)
				
			}
			user2.losses += 1;
			user2.winningStreak = 0;
		}
		else{
			if (user2.wins === 0){
				const debutAchievement = await this.userService.getAchievementByName('Grand Debut')
				user2.achievements.push(debutAchievement)
			}
			if (g.playerOneScore == 0 && g.playerTwoScore == 5){
				const flawlessAchievement = await this.userService.getAchievementByName('Flawless Victory')
				user2.achievements.push(flawlessAchievement)
				
			}
			user2.wins += 1;
			user2.winningStreak +=1;
			if (user2.winningStreak >= 5){
				const risingStarAchievement = await this.userService.getAchievementByName('Rising Star')
				user1.achievements.push(risingStarAchievement)
				
			}
			user1.losses += 1;
			user1.winningStreak = 0;
		}
		

		
		await this.userRepository.save(user1)
		await this.userRepository.save(user2)
	}

}
