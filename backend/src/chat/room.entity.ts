import { Entity, Column, PrimaryColumn, ManyToOne, OneToOne } from 'typeorm';
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

	@ManyToOne(() => User, (user) => user.id)
	owner: User;

//	@OneToMany(() => User, (user) => user.id)
//	owners: User[];

//	@OneToMany(() => User, (user) => user.id)
//	banned: User[];

//	@Column({
//		default: new Date()
//	})
//	creationDate: Date;
}
