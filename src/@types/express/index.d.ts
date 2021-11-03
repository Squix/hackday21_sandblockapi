import { IUser } from "@entities/user";

declare module 'express' {
    export interface Request  {
        body: {
            user: IUser,
            username: string,
            user_public_key:string,
            secret:string
        };
    }
}
