import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getParams, Response} from "@Utils/Http";
import {formatUserForPublic} from "@Utils/User";
import {getUserById} from "@API/Mongoose";
import Redis from "@API/RedisCache";
import {IUser} from "@Types/User";

export default class UserRoute implements TRoute {
    method = 'GET';
    path = '/auth/user/:id';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.loggedIn || !req.user) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized',
            }, 401);
        }

        const params = getParams(req, this);
        if (!params.id) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.user',
            }, 400);
        }

        if (params.id.startsWith('pseudo-')) {
            const user = await Redis.getInstance().get<IUser>('pseudo:user:' + params.id);

            if (!user) {
                return Response(res, {
                    status: 404,
                    message: 'user.not_existing',
                }, 404);
            }

            return Response(res, {
                status: 200,
                user: formatUserForPublic(user),
            });
        }

        const user = await getUserById(params.id);
        if (!user) {
            return Response(res, {
                status: 404,
                message: 'user.not_existing',
            }, 404);
        }

        return Response(res, {
            status: 200,
            user: formatUserForPublic(user),
        });
    }
}