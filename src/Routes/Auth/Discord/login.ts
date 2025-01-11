import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Redirect} from "@Utils/Http";

export default class DiscordLoginRoute implements TRoute {
    method = 'GET';
    path = '/auth/discord/login';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            redirect_uri: process.env.DISCORD_AUTH_CALLBACK_URL,
            response_type: 'code',
            prompt: "none",
            scope: 'identify email',
        });

        return Redirect(res, 'https://discord.com/api/oauth2/authorize' + '?' + params.toString());
    }
}