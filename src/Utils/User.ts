import {IConnection, IPublicConnection, IPublicUser, IUser} from "@Types/User";
import crypto from 'crypto';

export function formatUser(user: any): IUser {
    return {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        password: user.password,
        connections: user.connections ? user.connections.map((connection: IConnection) => {
            return {
                source: connection.source,
                username: connection.username,
                avatar: connection.avatar,
                email: connection.email,
                accessToken: connection.accessToken || null,
                refreshToken: connection.refreshToken || null,
                expires: connection.expires || 0
            }
        }) : [],
        permissions: user.permissions,
        newsLetter: user.newsLetter,
        twoFASecret: user.twoFASecret,
        createdAt: user.createdAt
    };
}

export function formatUserForPublic(user: any, isMe: boolean = false): IPublicUser & {
    email?: string,
    hasPassword?: boolean
} {
    return {
        id: user._id,
        displayName: user.displayName,
        email: isMe ? user.email : undefined,
        hasPassword: isMe ? !user.password.startsWith('by-') : undefined,
        connections: user.connections ? user.connections.map((connection: IPublicConnection) => {
            return {
                source: connection.source,
                username: connection.username,
                avatar: connection.avatar,
                email: connection.email
            }
        }) : [],
        permissions: user.permissions,
        newsLetter: user.newsLetter,
        createdAt: user.createdAt
    };
}

export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}


export function generateToken(userId: string) {
    return crypto.randomBytes(64).toString('hex') + userId;
}