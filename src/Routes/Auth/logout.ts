import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {deleteSession, Response} from "@Utils/Http";

export default class LogoutRoute implements TRoute {
    method = 'POST';
    path = '/auth/logout';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.loggedIn) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized'
            }, 401);
        }

        await deleteSession(req, res);

        return Response(res, {
            status: 200,
            message: 'user.logout.success',
        });
    }
}