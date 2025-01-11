import type {Middleware, TIncomingMessage, TMiddlewareNext, TServerResponse} from "@Types/HttpClient";
import {getHeaders, getSession, Response} from "@Utils/Http";
import {getUserByConnection, getUserById} from "@API/Mongoose";
import Redis from "@API/RedisCache";
import {IUser} from "@Types/User";

export default class UserInitMiddleware implements Middleware {
    global = true;

    async execute(req: TIncomingMessage, res: TServerResponse, next: TMiddlewareNext) {
        const session = await getSession(req);
        const headers = getHeaders(req);

        req.user = undefined;
        req.loggedIn = false;

        if (session) {
            const user = await getUserById(session.userId);

            if (user) {
                req.user = user;
                req.loggedIn = true;
            }

            if (session.connect && session.token) {
                const userId = await Redis.getInstance().get<string>('user:token:' + session.token);
                if (userId) {
                    const user = await getUserById(userId as string);
                    if (user) {
                        req.user = user;
                        req.loggedIn = true;
                    }
                }
            }
        }

        if (headers && headers.authorization) {
            const parsed = headers.authorization.split(' ');
            if (parsed[0] === 'Pseudo') {
                const userId = await Redis.getInstance().get<string>('pseudo:token:' + parsed[1]);
                if (userId) {
                    const user = await Redis.getInstance().get<IUser>('pseudo:user:' + userId);

                    if (user) {
                        req.user = user;
                        req.loggedIn = true;
                    }
                }
            }

            if (parsed[0] === 'User') {
                const userId = await Redis.getInstance().get<string>('user:token:' + parsed[1]);
                if (userId) {
                    const user = await getUserById(userId as string);
                    if (user) {
                        req.user = user;
                        req.loggedIn = true;
                    }
                }
            }
        }

        return next(true);
    }
}