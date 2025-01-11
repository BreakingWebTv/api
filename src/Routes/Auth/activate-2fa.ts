import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {enableTwoFA, getUser, setPasswordOfUser} from "@API/Mongoose";
import {hashPassword} from "@Utils/User";

export default class Activate2FARoute implements TRoute {
    method = 'POST';
    path = '/auth/activate-2fa';

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

        if (body.password.startsWith('by-')) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password_strength'
            }, 400);
        }

        const user = await getUser(req.user.email, hashPassword(body.oldPassword));
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

        const response = await enableTwoFA(user._id, hashPassword(body.password));
        if (typeof response === 'string') {
            return Response(res, {
                status: 400,
                message: response
            }, 400);
        }

        return Response(res, {
            status: 200,
            message: 'user.setup_2fa',
            secret: response.secret,
            qr: response.dataUrl
        });
    }
}