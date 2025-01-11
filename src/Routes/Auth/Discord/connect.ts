import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getQuery, getSession, Redirect, setSession} from "@Utils/Http";

export default class DiscordConnectRoute implements TRoute {
    method = 'GET';
    path = '/auth/discord/connect';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            redirect_uri: process.env.DISCORD_AUTH_CALLBACK_URL,
            response_type: 'code',
            prompt: "none",
            scope: 'identify email',
        });

        const session = await getSession(req);
        const query = getQuery(req);

        await setSession(req, res, {
            ...session,
            connect: 'discord',
            token: query.token ?? null,
        });

        return Redirect(res, 'https://discord.com/api/oauth2/authorize' + '?' + params.toString());
    }
}