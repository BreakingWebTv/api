import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {getUser, setPasswordOfUser} from "@API/Mongoose";
import {hashPassword} from "@Utils/User";

export default class SetPasswordRoute implements TRoute {
    method = 'POST';
    path = '/auth/set-password';

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

        if (!req.user.password.startsWith('by-') && !body.oldPassword) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password_old'
            }, 400);
        }

        if (req.user.password.startsWith('by-')) {
            await setPasswordOfUser(req.user._id, hashPassword(body.password));

            return Response(res, {
                status: 200,
                message: 'user.set_new_password'
            });
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g.test(body.password)) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password_strength'
            }, 400);
        }

        const user = await getUser(req.user.email, hashPassword(body.oldPassword), body?.twoFactorCode);
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

        await setPasswordOfUser(user._id, hashPassword(body.password));

        return Response(res, {
            status: 200,
            message: 'user.set_new_password'
        });
    }
}