import dotenv from 'dotenv';
import Logger from "@Utils/Logger";
import {loadMiddlewares} from "@Utils/MiddlewareLoader";
import {loadRoutes} from "@Utils/RouteLoader";
import {loadWorker} from "@Utils/WorkerLoader";
import {loadWebsocketEvents} from "@Utils/WebsocketEventsLoader";
import createMongooseConnection from '@API/Mongoose';
import createHttpClient from "@API/HttpClient";
import WebsocketClient from "@API/WebsocketClient";
import RedisQueue from "@API/RedisQueue";

dotenv.config();

process.env.STARTED_AT = Date.now();

createMongooseConnection().then(() => {
    Logger.info('Connected to MongoDB database', 'DATABASE');
});

const http = createHttpClient();

loadMiddlewares(http).then(() => {
    Logger.info('Middlewares loaded', 'MIDDLEWARE');
});
loadRoutes(http).then(() => {
    Logger.info('Routes loaded', 'ROUTES');
});
loadWebsocketEvents(WebsocketClient.getInstance()).then(() => {
    Logger.info('Websocket events loaded', 'WEBSOCKET');
});
loadWorker(RedisQueue.getInstance()).then(() => {
    Logger.info('Workers loaded', 'QUEUE');
});

http.listen(Number(process.env.PORT) || 3000);
WebsocketClient.getInstance().openConnections(Number(process.env.WEBSOCKET_PORT) || 3001);