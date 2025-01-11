import fs from "fs";
import path from "path";
import Logger from "@Utils/Logger";
import WebsocketClient from "@API/WebsocketClient";
import type {IWebsocketPayloadData, TClient, TEvent} from "@Types/Websocket";

export async function loadWebsocketEvents(websocket: WebsocketClient) {
    const loadRoutesFromDir = (dir: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.lstatSync(fullPath);

            if (stat.isDirectory()) {
                loadRoutesFromDir(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const EventClass = require(fullPath).default;

                if (EventClass) {
                    const event: TEvent = new EventClass();

                    websocket.listenTo(
                        event.op.toUpperCase(),
                        async (client: TClient, payload: IWebsocketPayloadData) => await event.execute(client, payload)
                    );

                    Logger.info(`Loaded websocket event ${event.op}`, 'WEBSOCKET');
                }
            }
        }
    };

    loadRoutesFromDir(path.join(__dirname, "../Events"));
}
