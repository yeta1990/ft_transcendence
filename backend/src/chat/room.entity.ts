import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Room { 

	@PrimaryColumn({
		unique: true	
	})
	name: string;

	@Column({
		nullable: false, 
		default: false
	})
	hasPass: boolean;

	@Column({nullable: true})
	password: string;

//	@OneToMany(() => User, (user) => user.id)
//	owners: User[];

//	@OneToMany(() => User, (user) => user.id)
//	banned: User[];

	@Column({
		default: new Date()
	})
	creationDate: Date;
}
