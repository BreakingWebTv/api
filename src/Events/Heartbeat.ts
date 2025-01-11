import type {IWebsocketPayloadData, TClient, TEvent} from "@Types/Websocket";

export default class HeartbeatEvent implements TEvent {
    op = 'HEARTBEAT';

    async execute(client: TClient, data: IWebsocketPayloadData) {
        if (client.lastPing && Date.now() - client.lastPing < 30 * 1000) {
            return;
        }

        client.lastPing = Date.now();
    }
}