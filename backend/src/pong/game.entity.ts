import { PrimaryGeneratedColumn, Entity, Column, } from 'typeorm';

@Entity()
export class Game {
	
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	player1: string;

	@Column()
	player2: string;
	
	@Column()
	player1Points: number;

	@Column()
	player2Points: number;

}
