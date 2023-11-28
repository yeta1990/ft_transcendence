import { Entity, PrimaryGeneratedColumn, Column }  from 'typeorm'

@Entity()
export class InvalidTokens {

	@PrimaryGeneratedColumn()
	id: number;

	@Column({unique: false})
	token: string;

}
