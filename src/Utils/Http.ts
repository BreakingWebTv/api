import type {TIncomingMessage, TServerResponse} from "@Types/HttpClient";
import Redis from "@API/RedisCache";

export function Response(res: TServerResponse, data: string | object | any[], status: number = 200): void {
    res.statusCode = status;

    if (res.cameInAt) {
        res.setHeader('X-BREAKING-WEB-RESPONSE-TIME', (Date.now() - res.cameInAt).toString());
    }

    if (typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    } else {
        res.setHeader('Content-Type', 'text/plain');
        res.end(data);
    }
}

export function Redirect(res: TServerResponse, url: string, status: 301 | 302 = 301): void {
    res.statusCode = status;
    res.setHeader('Location', url);
    res.end();
}

export function ImageResponse(res: TServerResponse, buffer: Buffer, status: number = 200): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'image/jpeg');
    res.end(buffer);
}

export async function setSession(req: TIncomingMessage, res: TServerResponse, data: Record<string, any>): Promise<void> {
    const cookies = getCookies(req);
    let sessionId = cookies.sessionId;

    if (!sessionId) {
        sessionId = 'BREAKING-WEB-SESSION-' + Math.random().toString(36).substr(2, 9);
        setCookies(res, {sessionId});
    }

    await Redis.getInstance().set<Record<string, any>>('session-' + sessionId, {
        ...data,
        createdAt: new Date()
    });
}

export async function deleteSession(req: TIncomingMessage, res: TServerResponse): Promise<void> {
    const cookies = getCookies(req);
    const sessionId = cookies.sessionId;

    if (sessionId) {
        await Redis.getInstance().delete('session-' + sessionId);
        setCookies(res, {sessionId: ''});
    }
}

export async function getSession(req: TIncomingMessage): Promise<Record<string, any> | undefined> {
    const cookies = getCookies(req);

    if (cookies.sessionId) {
        const session = await Redis.getInstance().get<Record<string, any> | undefined>('session-' + cookies.sessionId);

        if (session && session.createdAt && (new Date(session.createdAt)).getTime() + 1000 * 60 * 60 * 24 * 7 > Date.now()) {
            return session;
        }
    }

    return undefined;
}

export function getQuery(req: TIncomingMessage): Record<string, any> {
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    const query: Record<string, string | number> = {};
    const params = url.searchParams;

    for (const key of params.keys()) {
        const value = params.get(key);
        if (value !== null) {
            query[key] = isNaN(Number(value)) ? value : Number(value);
        }
    }

    return query;
}

export function getParams(req: TIncomingMessage, context: { path: string }): Record<string, string> {
    if (req.params) {
        return req.params;
    }

    const routeParts = context.path.split('/');
    const urlParts = (req.url || '').split('?')[0].split('/');

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
        const part = routeParts[i];

        if (part.startsWith(':')) {
            const paramName = part.slice(1);
            params[paramName] = urlParts[i] || '';
        }
    }

    return params;
}

export function setCookies(res: TServerResponse, cookies: Record<string, string>): void {
    const cookieStrings = Object.entries(cookies).map(([key, value]) => `${key}=${value}`);

    res.setHeader('Set-Cookie', cookieStrings);
}

export function getCookies(req: TIncomingMessage): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookiePairs = cookieHeader.split(';');

        for (const pair of cookiePairs) {
            const [key, value] = pair.split('=').map(part => part.trim());
            cookies[key] = value;
        }
    }

    return cookies;
}

export function getHeaders(req: TIncomingMessage): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.headers)) {
        headers[key] = value as string;
    }

    return headers;
}

export function getIP(req: TIncomingMessage): string {
    const raw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    return (Array.isArray(raw) ? raw[0] : raw).split(',')[0].trim();
}