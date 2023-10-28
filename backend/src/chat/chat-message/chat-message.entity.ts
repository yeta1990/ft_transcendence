import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from '../room.entity'

@Entity()
export class ChatMessage {

	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Room, (room) => room.messages, {
		onDelete: 'CASCADE'	
	})
	room: string;

	@Column()
	message: string;

	@Column()
	login: string;

	@Column()
	date: Date;

}
