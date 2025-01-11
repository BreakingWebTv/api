import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response, setSession} from "@Utils/Http";
import {checkUserExists, createUser, getUser} from "@API/Mongoose";
import {formatUserForPublic, hashPassword} from "@Utils/User";

export default class RegisterRoute implements TRoute {
    method = 'POST';
    path = '/auth/register';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.body) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid'
            }, 400);
        }

        const {displayName, email, password} = req.body;

        if (!displayName || !email || !password) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid'
            }, 400);
        }

        if (password.startsWith('by-')) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password_strength'
            }, 400);
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g.test(password)) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.password_strength'
            }, 400);
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/g.test(email)) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.email'
            }, 400);
        }

        if (!/^[a-zA-Z0-9_.-]{3,20}$/g.test(displayName)) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.username'
            }, 400);
        }

        const exists = await checkUserExists(email);
        if (exists) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.email_exists'
            }, 400);
        }

        await createUser(displayName, email, hashPassword(password));

        const createdUser = await getUser(email, hashPassword(password));
        if (!createdUser) {
            return Response(res, {
                status: 500,
                message: 'user.register.error'
            }, 500);
        }

        if (typeof createdUser === 'string') {
            return Response(res, {
                status: 401,
                message: createdUser
            }, 401);
        }

        await setSession(req, res, {
            userId: createdUser._id
        });

        req.user = createdUser;
        req.loggedIn = true;

        return Response(res, {
            status: 200,
            message: 'user.register.success',
            user: formatUserForPublic(createdUser)
        })
    }
}