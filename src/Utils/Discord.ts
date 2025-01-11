import process from "node:process";
import {RESTGetAPIUserResult, RESTPostOAuth2AccessTokenResult} from "discord-api-types/v10";
import {URLSearchParams} from "url";
import {isErrorResponse, TErrorResponse} from "@Types/Discord";
import Logger from "@Utils/Logger";

export function buildAvatarUrl(userId: string, avatar: Nullable<string>): string {
    if (!avatar) { // @ts-ignore
        return `https://cdn.discordapp.com/embed/avatars/${userId % 5}.png`;
    }

    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${avatar.includes('a_') ? 'gif' : 'webp'}?size=1024`;
}

export function isSnowflake(input: string): boolean {
    return /^\d{17,19}$/.test(input);
}

export async function fetchUserAfterLogin(code: string, activity: boolean = false): Promise<string | {
    id: string;
    username: string;
    avatar: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expires: number;
}> {
    if (!code) {
        return 'discord.response.invalid_code';
    }

    Logger.debug('Fetching user data from Discord IsActivity:' + activity, 'DISCORD');

    let params: URLSearchParams;
    if (activity) {
        params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
        });
    } else {
        params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_AUTH_CALLBACK_URL,
            scope: 'identify email',
        });
    }

    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    }).catch(() => null);

    if (!response) {
        return 'discord.response.invalid';
    }

    const data = await response.json() as RESTPostOAuth2AccessTokenResult | TErrorResponse;
    if (!data) {
        return 'discord.response.invalid_data';
    }

    if (isErrorResponse(data)) {
        console.log(data);
        Logger.debug('Discord OAuth2 error: ' + data.error_description + ' ' + data.error_description, 'DISCORD');
        Logger.debug(params.toString(), 'DISCORD');

        return 'discord.response.invalid_code';
    }

    const neededScopes = activity ? ['email', 'identify', 'rpc.activities.write', 'rpc.voice.read'] : ['email', 'identify'];
    if (neededScopes.some(scope => !data.scope.includes(scope))) {
        Logger.debug('Discord OAuth2 error: invalid scope', 'DISCORD');
        Logger.debug('Got scopes: ' + data.scope, 'DISCORD');
        Logger.debug('Needed scopes: ' + neededScopes.join(', '), 'DISCORD');

        return 'discord.response.invalid_scope';
    }

    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
            Authorization: `${data.token_type} ${data.access_token}`
        }
    }).catch(() => null);

    if (!userResponse) {
        return 'discord.response.invalid_user_fetch';
    }

    const user = await userResponse.json() as RESTGetAPIUserResult;
    if (!user || !user.id) {
        return 'discord.response.invalid_user_data';
    }

    return {
        id: user.id,
        username: user.username,
        avatar: buildAvatarUrl(user.id, user.avatar),
        email: user.email!,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expires: Date.now() + (data.expires_in * 1000),
    }
}