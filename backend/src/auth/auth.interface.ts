import { Request } from "express";
import { User } from '../user/user.entity'

export interface RequestWithUser extends Request {
	userId: number;
	loginCode: string,
	message: string;
}


export interface LoginBody extends Request {
	code: string;
}
