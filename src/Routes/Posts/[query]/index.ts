import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getParams, Response} from "@Utils/Http";
import RedisCache from "@API/RedisCache";
import {Time} from "@Types/Time";
import {formatPostForPublic} from "@Utils/Post";
import {fetchPost} from "@API/Mongoose";

export default class GetPostRoute implements TRoute {
    method = 'GET';
    path = '/posts/:query';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const params = getParams(req, this);
        if (!params || !params.query) {
            return Response(res, {
                status: 404,
                message: 'payload.invalid.query',
            });
        }

        const getFromId = await RedisCache.getInstance().get('posts:' + params.query);
        if (getFromId) {
            return Response(res, {
                status: 200,
                data: formatPostForPublic(getFromId)
            });
        }

        const getFromUniqueSlug = await RedisCache.getInstance().get('posts:uniqueSlug:' + params.query);
        if (getFromUniqueSlug) {
            const data = await RedisCache.getInstance().get('posts:' + getFromUniqueSlug);
            if (data) {
                return Response(res, {
                    status: 200,
                    data: formatPostForPublic(data)
                });
            }
        }

        const getFromSlug = await RedisCache.getInstance().get('posts:slug:' + params.query);
        if (getFromSlug) {
            const data = await RedisCache.getInstance().get('posts:' + getFromSlug);
            if (data) {
                return Response(res, {
                    status: 200,
                    data: formatPostForPublic(data)
                });
            }
        }

        const post = await fetchPost(params.query);
        if (!post) {
            return Response(res, {
                status: 404,
                message: 'post.not_exiting',
            }, 404)
        }

        await RedisCache.getInstance().set('posts:' + post._id, post, Time.Day);
        await RedisCache.getInstance().set('posts:uniqueSlug:' + post.uniqueSlug, post._id, Time.Day);

        for (const content of post.contents) {
            await RedisCache.getInstance().set('posts:slug:' + content.slug, post._id, Time.Day);
        }

        return Response(res, {
            status: 200,
            data: formatPostForPublic(post)
        });
    }
}