import {EWebsocketWorkerJobs, IWorkerPayloadData, TWorker} from "@Types/RedisQueue";
import WebsocketClient from "@API/WebsocketClient";
import type {IWebsocketPayload} from "@Types/Websocket";

export default class ForwardWebsocketEventsWorker implements TWorker {
    jobName = EWebsocketWorkerJobs.ForwardWebsocketEvents;

    async execute(data: IWorkerPayloadData) {
        const payload = data as { id: string, payload: IWebsocketPayload };
        if (!payload.id || !payload.payload) {
            throw new Error('Invalid payload');
        }

        await WebsocketClient.getInstance().broadcast(payload.id, payload.payload);
    }
}