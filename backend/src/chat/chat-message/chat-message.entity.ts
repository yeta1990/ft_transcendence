import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ChatMessage {

	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	room: string;

	@Column()
	message: string;

	@Column()
	nick: string;

	@Column()
	date: Date;

}
