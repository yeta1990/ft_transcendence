export declare enum UserStatus {
    OFFLINE = 0,
    ONLINE = 1,
    LOBBY = 2,
    PLAYING = 3,
    SPECTATING = 4
}
export declare class User {
    id: number;
    nick: string;
    firstName: string;
    lastName: string;
    login: string;
    image: string;
    status: UserStatus;
    email: string;
    mfa: boolean;
    validateEmail(): void;
    validateLength(str: string, field: string, min: number, max: number): void;
}
