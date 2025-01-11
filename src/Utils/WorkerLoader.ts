import fs from "fs";
import path from "path";
import Logger from "@Utils/Logger";
import RedisQueue from "@API/RedisQueue";
import {IWorkerPayloadData, TWorker} from "@Types/RedisQueue";

export async function loadWorker(queue: RedisQueue) {
    const loadRoutesFromDir = (dir: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.lstatSync(fullPath);

            if (stat.isDirectory()) {
                loadRoutesFromDir(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const WorkerClass = require(fullPath).default;

                if (WorkerClass) {
                    const event: TWorker = new WorkerClass();

                    queue.listenTo(
                        event.jobName.toUpperCase(),
                        async (payload: IWorkerPayloadData) => await event.execute(payload)
                    );

                    Logger.info(`Loaded worker ${event.jobName}`, 'WEBSOCKET');
                }
            }
        }
    };

    loadRoutesFromDir(path.join(__dirname, "../Workers"));
}
