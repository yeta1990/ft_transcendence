export const enum UserStatus {
	OFFLINE,
	ONLINE,
	LOBBY,
	PLAYING,
	SPECTATING
}

export const enum UserRole {
	VISITOR,
	REGISTRED,
	USER,
	PREMIUM,
	MODERATOR,
	ADMIN,
	DEVELOPER,
	ROOT
}

export const enum ChannelRole {
	USER,
	MODERATOR,
	ADMINISTRATOR
}

export const enum ChannelType {
	PUBLIC,
	PRIVATE,
	ANNOUNCEMENT,
	PERSONAL_MESSAGE
}

export enum Campuses {
	None = 'None',
	Alicante = '42Alicante',
	Barcelona = '42Barcelona',
	Madrid = '42Madrid',
	Malaga = '42Málaga',
	Urduliz = '42Urduliz'
}

export enum EloRank {
	Principiante = 1000,
	Aficionado = 1200,
	Intermedio = 1400,
	Avanzado = 1600,
	Experto = 1800,
	Maestro = 2000
}
