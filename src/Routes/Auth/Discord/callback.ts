import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getQuery, getSession, Redirect, setSession} from "@Utils/Http";
import {fetchUserAfterLogin} from "@Utils/Discord";
import {addConnectionToUser, checkUserExists, createUserByConnection, getUserByConnection} from "@API/Mongoose";
import {generateToken} from "@Utils/User";
import Redis from "@API/RedisCache";
import {Time} from "@Types/Time";

export default class DiscordCallbackRoute implements TRoute {
    method = 'GET';
    path = '/auth/discord/callback';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const {
            code
        } = getQuery(req);

        if (!code) {
            return Redirect(res, process.env.WEBSITE_URL + '/auth/login?error=discord.response.invalid_code');
        }

        const fetch = await fetchUserAfterLogin(code as string);
        if (typeof fetch === 'string') {
            return Redirect(res, process.env.WEBSITE_URL + '/auth/login?error=' + fetch);
        }

        const session = await getSession(req);
        if (session && session.connect === 'discord') {
            if (!req.loggedIn || !req.user) {
                return Redirect(res, process.env.WEBSITE_URL + '/auth/login');
            }

            if (req.user.connections.find(c => c.source === 'discord')) {
                return Redirect(res, process.env.WEBSITE_URL + '/profile?error=discord.connection.already_connected');
            }

            await addConnectionToUser(req.user._id, 'discord', fetch.id, fetch.username, fetch.avatar, fetch.email, fetch.accessToken, fetch.refreshToken, fetch.expires);

            const updatedUser = await getUserByConnection('discord', fetch.id);
            if (!updatedUser) {
                return Redirect(res, process.env.WEBSITE_URL + '/profile?error=discord.connection.failed');
            }

            req.user = updatedUser;
            req.loggedIn = true;

            return Redirect(res, process.env.WEBSITE_URL + '/profile?success=discord.connection.success');
        }

        const user = await getUserByConnection('discord', fetch.id);
        if (!user) {
            const user = await getUserByConnection('discord', fetch.id);
            if (user) {
                return Redirect(res, process.env.WEBSITE_URL + '/auth/login?error=discord.register.already_connected');
            }

            const exists = await checkUserExists(fetch.email);
            if (exists) {
                return Redirect(res, process.env.WEBSITE_URL + '/auth/login?error=discord.register.email_already_connected');
            }

            await createUserByConnection('discord', fetch.id, fetch.username, fetch.avatar, fetch.email, fetch.accessToken, fetch.refreshToken, fetch.expires);

            const createdUser = await getUserByConnection('discord', fetch.id);
            if (!createdUser) {
                return Redirect(res, process.env.WEBSITE_URL + '/auth/login?error=discord.register.failed');
            }

            await setSession(req, res, {
                userId: createdUser._id,
                setPasswordWithoutOld: true
            });

            req.user = createdUser;
            req.loggedIn = true;

            const token = generateToken(createdUser._id);
            const websocketToken = generateToken(createdUser._id);

            await Redis.getInstance().set('user:token:' + token, createdUser._id, Time.Week);
            await Redis.getInstance().set('websocket:token:' + websocketToken, createdUser._id, Time.Week);

            return Redirect(res, process.env.WEBSITE_URL + '/auth/set-password' + `?token=${token}&websocketToken=${websocketToken}`);
        }

        req.user = user;
        req.loggedIn = true;

        await setSession(req, res, {
            userId: user._id
        });

        const token = generateToken(user._id);
        const websocketToken = generateToken(user._id);

        await Redis.getInstance().set('user:token:' + token, user._id, Time.Week);
        await Redis.getInstance().set('websocket:token:' + websocketToken, user._id, Time.Week);

        return user.password.startsWith('by-discord')
            ? Redirect(res, process.env.WEBSITE_URL + '/auth/set-password' + `?token=${token}&websocketToken=${websocketToken}`)
            : Redirect(res, process.env.WEBSITE_URL + `/profile?token=${token}&websocketToken=${websocketToken}`);
    }
}