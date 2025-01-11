export interface IWebsocketPayloadData {
    [key: string]: string | number | boolean | null | object;
}

export interface IWebsocketPayload {
    o: string;
    d: IWebsocketPayloadData;
}

import type {WebSocket} from 'ws';

export type TClient = WebSocket & {
    socketId: string,
    userId: string,
    lastPing: number
};

export type TWebsocketEvent = (client: TClient, data: IWebsocketPayloadData) => Promise<void>;

export type TEvent = {
    op: string;
    execute: TWebsocketEvent;
};