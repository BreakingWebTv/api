import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {getUser} from "@API/Mongoose";
import {hashPassword} from "@Utils/User";

export default class ExportRoute implements TRoute {
    method = 'POST';
    path = '/auth/export';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.body) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid'
            }, 400);
        }

        const body = req.body;

        if (!req.loggedIn || !req.user) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized'
            }, 401);
        }

        if (!body.password) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password'
            }, 400);
        }

        const user = await getUser(req.user.email, hashPassword(body.password), body?.twoFactorCode);
        if (!user) {
            return Response(res, {
                status: 401,
                message: 'user.not_existing_or_password_wrong'
            }, 401);
        }

        if (typeof user === 'string') {
            return Response(res, {
                status: 401,
                message: user
            }, 401);
        }

        return Response(res, {
            status: 200,
            user: {
                ...user,
                password: undefined,
            }
        });
    }
}