import { PrimaryGeneratedColumn, Entity, Column, PrimaryColumn, ManyToOne, OneToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Room { 

//	@PrimaryGeneratedColumn()
//	id: number;

	
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

	@ManyToMany(() => User, (user) => user.joinedRooms)
//		{createForeignKeyConstraints: false}) 
//		in case of problems deleting anything related
//		to the Room entity and getting any kind of
//		'foreign key' error, try using the createForeignKeyConstraints option
	@JoinTable()
	users: User[];

	@ManyToMany(() => User, (user) => user.adminRooms)
	@JoinTable()
	admins: User[];

	@ManyToMany(() => User, (user) => user.bannedRooms)
	@JoinTable()
	banned: User[];

//	@OneToMany(() => User, (user) => user.id)
//	banned: User[];

//	@Column({
//		default: new Date()
//	})
//	creationDate: Date;
}
