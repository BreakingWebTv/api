declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: number;
            WEBSOCKET_PORT: number;

            WEBSITE_URL: string;

            API_KEY_FOR_DISCORD_BOT: string;

            QUEUE_NAME: string;

            DATABASE_URL: string;

            STARTED_AT: number;

            REDIS_HOST: string;
            REDIS_PORT: number;
            REDIS_PASSWORD: string;

            DISCORD_CLIENT_ID: string;
            DISCORD_CLIENT_SECRET: string;
            DISCORD_AUTH_CALLBACK_URL: string;
        }
    }
}

export {}