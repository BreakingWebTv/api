import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getIP, getQuery, Response, setSession} from "@Utils/Http";
import {getUser} from "@API/Mongoose";
import {formatUserForPublic, generateToken, hashPassword} from "@Utils/User";
import Redis from "@API/RedisCache";
import {DiscordSnowflake} from "@sapphire/snowflake";
import {IUser} from "@Types/User";
import {Time} from "@Types/Time";

export default class LoginRoute implements TRoute {
    method = 'POST';
    path = '/auth/login';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const query = getQuery(req);
        if (query.pseudo) {
            const oldToken = await Redis.getInstance().get('pseudo:token:ip:' + hashPassword(getIP(req)));
            if (oldToken) {
                const userId = await Redis.getInstance().get<string>('pseudo:token:' + oldToken);
                if (userId) {
                    const user = await Redis.getInstance().get<IUser>('pseudo:user:' + userId);
                    if (user) {
                        return Response(res, {
                            status: 200,
                            message: 'user.login.success.pseudo',
                            user: formatUserForPublic(user),
                            token: oldToken,
                            pseudo: true,
                        });
                    }
                }
            }

            const pseudoId = 'pseudo-' + String(DiscordSnowflake.generate());
            const token = generateToken(pseudoId);
            const websocketToken = generateToken(pseudoId);

            const pseudoUser = {
                _id: pseudoId,
                displayName: 'Guest',
                email: 'guest@breakingweb.tv',
                password: token,
                connections: [],
                level: 0,
                xp: 0,
                listeningStats: [],
                hideInLeaderboard: false,
                createdAt: new Date().toISOString(),
            };

            await Redis.getInstance().set('pseudo:token:' + token, pseudoId, Time.Day);
            await Redis.getInstance().set('pseudo:user:' + pseudoId, pseudoUser, Time.Day);
            await Redis.getInstance().set('pseudo:token:ip:' + hashPassword(getIP(req)), token, Time.Day);

            return Response(res, {
                status: 200,
                message: 'user.login.success.pseudo',
                user: formatUserForPublic(pseudoUser),
                token: token,
                websocketToken: websocketToken,
                pseudo: true,
            });
        }

        if (!req.body) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid'
            }, 400);
        }

        const {email, password} = req.body;

        if (!email || !password) {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.email_or_password'
            }, 400);
        }

        if (password.startsWith('by-')) {
            return Response(res, {
                status: 400,
                message: 'user.login.error.invalid_source'
            }, 400);
        }

        const user = await getUser(email, hashPassword(password), req.body?.twoFACode);
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

        await setSession(req, res, {
            userId: user._id
        });

        req.user = user;
        req.loggedIn = true;

        const token = generateToken(user._id);
        const websocketToken = generateToken(user._id);

        await Redis.getInstance().set('user:token:' + token, user._id, Time.Week);

        return Response(res, {
            status: 200,
            message: 'user.login.success.normal',
            user: formatUserForPublic(user),
            token: token,
            websocketToken: websocketToken,
            pseudo: false,
        });
    }
}