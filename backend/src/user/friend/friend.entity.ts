import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { User } from '../user.entity';

@Entity()
export class Friend {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	friendName: string;

	@ManyToMany(() => User, user => user.friends)
	users: User[];
} 
