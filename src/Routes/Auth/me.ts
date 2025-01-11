import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {formatUserForPublic} from "@Utils/User";

export default class MeRoute implements TRoute {
    method = 'GET';
    path = '/auth/me';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.loggedIn || !req.user) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized',
            }, 401);
        }

        return Response(res, {
            status: 200,
            user: formatUserForPublic(req.user, true),
        });
    }
}