import {Queue, Worker} from 'bullmq';
import Redis from './RedisCache';
import type RedisClient from 'ioredis';
import {TWorkerEvent} from '@Types/RedisQueue';

export default class RedisQueue {
    private static _instance: RedisQueue;
    private readonly _redis: RedisClient;
    private readonly _queues: Map<string, Queue>;

    private constructor(redis: RedisClient) {
        this._redis = redis;
        this._queues = new Map();
    }

    public static getInstance(): RedisQueue {
        if (!RedisQueue._instance) {
            RedisQueue._instance = new RedisQueue(Redis.getInstance().getClient());
        }
        return RedisQueue._instance;
    }

    public async addJob(jobName: string, data: Record<string, unknown>): Promise<void> {
        if (!this._queues.has(jobName)) {
            this._queues.set(
                jobName,
                new Queue(jobName, {
                    connection: this._redis,
                })
            );
        }
        const queue = this._queues.get(jobName);
        if (queue) {
            await queue.add(jobName, data);
        }
    }

    public listenTo(jobName: string, callback: TWorkerEvent, maxPerSecond: number = 1000): void {
        if (!this._queues.has(jobName)) {
            this._queues.set(
                jobName,
                new Queue(jobName, {
                    connection: this._redis,
                })
            );
        }

        new Worker(
            jobName,
            async (job) => {
                if (job && job.data) {
                    await callback(job.data);
                }
            },
            {
                connection: this._redis,
                limiter: {
                    max: maxPerSecond,
                    duration: 1000,
                },
            }
        );
    }
}