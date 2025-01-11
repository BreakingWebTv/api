export interface IWorkerPayloadData {
    [key: string]: string | number | boolean | null | object;
}

export type TWorkerEvent = (data: IWorkerPayloadData) => Promise<void>;

export type TWorker = {
    jobName: string;
    execute: TWorkerEvent;
};

export enum EWebsocketWorkerJobs {
    ForwardWebsocketEvents = 'FORWARD_WEBSOCKET_EVENTS',
}

export enum ENotificationJobs {
    HandleNewNews = 'HANDLE_NEW_NEWS',
}