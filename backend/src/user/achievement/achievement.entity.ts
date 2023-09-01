import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../user.entity';

@Entity()
export class Achievement {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	description: string;

	@ManyToMany(() => User, user => user.achievements)
	@JoinTable()
	users: User[];
}
