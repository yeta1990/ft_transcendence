import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';

import { Room } from '../chat/room.entity';
export enum UserStatus {
	OFFLINE,
	ONLINE,
	LOBBY,
	PLAYING,
	SPECTATING
}

function validateStringLength(value: string, min: number, max: number): boolean {
	return value.length <= max && value.length >= min;
  }

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;
	
	// IDENTIFICACION -------------------------------------
	@Column({
		unique: true,
	})
	nick: string;
	
	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@Column({
		unique: true,
		nullable: true
	})
	login: string;

	/**
	 * PASS??? (HASH???)
	 */

	// PERSONALIZACION -------------------------------------
	@Column({
		default: '' //Poner ruta de imagen por defecto
	})
	image: string;

	// ESTADISTICAS Y JUEGO ---------------------------------
	@Column({
		default: UserStatus.OFFLINE
	})
	status: UserStatus;

	/**
	 * ACHIEVEMENTS
	 * WINS
	 * LOOSES
	 * ELO
	 * CREATION DATA
	 * LAST LOGIN
	 * DAYS ON A ROW (para achievement)
	 */

	// VALIDACION Y SEGURIDAD --------------------------------
	@Column({
		unique: true,
	})
	email: string;

	@Column({
		default:false
	})
	mfa: boolean;

	@OneToMany(() => Room, (room) => room.owner)
	@JoinColumn({name: "name"})
	ownedRooms: Room[]

	// FUNCIONES ---------------------------------------------

	validateEmail() {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(this.email)) {
		  throw new Error('Value of the "email" field is not valid');
		}
	  }

	  validateLength( str: string, field: string, min: number, max: number) {
		if (!validateStringLength(str, min, max)) {
			if (min === max)
		  		throw new Error(`Lenght of ${field} must be ${min} characters`);
			else
				throw new Error(`Lenght of ${field} must be between ${min} and ${max} characters`)
		}
	}
}

