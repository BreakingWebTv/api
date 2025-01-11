import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {EUserPermission} from "@Types/User";

export default class CreatePostCommentRoute implements TRoute {
    method = 'POST';
    path = '/posts/:query/comments/create';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.loggedIn || !req.user) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized',
            }, 401);
        }

        if (!req.user.permissions.includes(EUserPermission.CreateComment)) {
            return Response(res, {
                status: 401,
                message: 'user.invalid_permissions',
                needed: [EUserPermission.CreateComment]
            }, 401);
        }

        const body = req.body;
        if (!body) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid',
            }, 400);
        }


    }
}