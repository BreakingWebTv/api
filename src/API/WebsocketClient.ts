import {WebSocket, WebSocketServer} from 'ws';
import {DiscordSnowflake} from '@sapphire/snowflake'
import type {IWebsocketPayload, TClient, TWebsocketEvent} from "@Types/Websocket";
import Logger from "@Utils/Logger";
import NoOperation from "@Utils/NoOperation";

export default class WebsocketClient {
    private static _instance: WebsocketClient;
    private _wss: WebSocketServer | null = null;
    private _events: Record<string, TWebsocketEvent> = {};

    private constructor() {
    }

    public static getInstance(): WebsocketClient {
        if (!WebsocketClient._instance) {
            WebsocketClient._instance = new WebsocketClient();
        }

        return WebsocketClient._instance;
    }

    public listenTo(op: string, execute: TWebsocketEvent): void {
        this._events[op] = execute;
    }

    public async broadcast(id: string, data: IWebsocketPayload): Promise<void> {
        if (!this._wss) {
            return;
        }

        const message = JSON.stringify(data);

        if (id === 'broadcast') {
            Logger.info(`Broadcasting to all clients`, 'WEBSOCKET');

            this._wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        } else {
            Logger.info(`Broadcasting to ${id}`, 'WEBSOCKET');

            const filters = id.split('_').map(filter => {
                const [type, typeId] = filter.split(':');
                return {type, typeId};
            });

            const filterClient = (client: TClient) => {
                return filters.every(({type, typeId}) => {
                    const isNegation = type.startsWith('!');
                    const actualType = isNegation ? type.substring(1) : type;
                    const clientValue = client[actualType];

                    if (typeId === 'true') {
                        return isNegation ? clientValue !== true : clientValue === true;
                    } else if (typeId === 'false') {
                        return isNegation ? clientValue !== false : clientValue === false;
                    } else {
                        return isNegation ? clientValue !== typeId : clientValue === typeId;
                    }
                });
            };

            this._wss.clients.forEach(rawClient => {
                const client = rawClient as TClient;

                if (client.readyState === WebSocket.OPEN && filterClient(client)) {
                    client.send(message);
                }
            });
        }
    }

    public openConnections(port: number): void {
        if (this._wss) {
            return;
        }

        this._wss = new WebSocketServer({port});

        this._wss.on('connection', async (ws: TClient) => {
            ws.socketId = String(DiscordSnowflake.generate());

            ws.on('message', (payload: IWebsocketPayload) => {
                let data: IWebsocketPayload;
                try {
                    data = JSON.parse(payload.toString());
                } catch (error) {
                    return;
                }

                if (!data.o) {
                    return;
                }

                const event = this._events[data.o];
                if (!event) {
                    return;
                }

                event(ws, data.d ?? {}).finally(NoOperation);
            });

            ws.on('close', async () => {
                Logger.info(`Websocket connection closed: ${ws.socketId}`, 'WEBSOCKET');

                await this._handleDisconnect(ws);
            });

            ws.on('error', () => {
                Logger.error(`Websocket connection errored: ${ws.socketId}`, 'WEBSOCKET');
            });
        });

        setInterval(() => this._checkConnections(), 60 * 1000);
    }

    private async _handleDisconnect(ws: TClient): Promise<void> {
        Logger.debug(`Handling disconnect for ${ws.socketId}`, 'WEBSOCKET');
    }

    private _checkConnections(): void {
        if (!this._wss) {
            return;
        }

        this._wss.clients.forEach(async rawClient => {
            const client = rawClient as TClient;

            if (client.readyState !== WebSocket.OPEN) {
                client.terminate();

                await this._handleDisconnect(client);

                Logger.info(`Websocket connection didnt became ready in time: ${client.socketId}`, 'WEBSOCKET');
            }

            if (client.lastPing && Date.now() - client.lastPing > 5 * 60 * 1000) {
                client.terminate();

                await this._handleDisconnect(client);

                Logger.info(`Websocket connection timed out: ${client.socketId}`, 'WEBSOCKET');
            }
        });
    }
}