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

	@ManyToMany(
		() => User, 
		{createForeignKeyConstraints: false})
	@JoinTable()
	users: User[];
 


//	@OneToMany(() => User, (user) => user.id)
//	banned: User[];

//	@Column({
//		default: new Date()
//	})
//	creationDate: Date;
}
