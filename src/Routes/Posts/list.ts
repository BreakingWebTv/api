import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {getQuery, Response} from "@Utils/Http";
import {fetchPosts, validateTags} from "@API/Mongoose";
import RedisCache from "@API/RedisCache";
import {IPublicPost} from "@Types/Post";

export default class GetPostsRoute implements TRoute {
    method = 'GET';
    path = '/posts/list';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        const query = getQuery(req);
        let tags: string[] = [];

        if (query.tags && typeof query.tags === 'string') {
            tags = query.tags.split(',');

            const tagsAreValid = await validateTags(tags);
            if (!tagsAreValid) {
                return Response(res, {
                    status: 400,
                    message: 'payload.invalid.tags'
                }, 400);
            }
        }

        if (query.query || typeof query.query !== 'string') {
            return Response(res, {
                status: 400,
                message: 'payload.invalid.query'
            }, 400);
        }

        const fromCache = await RedisCache.getInstance().get<{
            posts: IPublicPost[],
            hasMore: boolean
        }>('posts:list:' + JSON.stringify(query));
        if (fromCache) {
            if (!fromCache.posts.length) {
                return Response(res, {
                    status: 404,
                    message: 'post.none_found_by_query'
                }, 404);
            }

            return Response(res, {
                status: 200,
                data: fromCache
            });
        }

        let page = 0;
        if (query.page && typeof query.page === 'number') {
            page = query.page;
        }

        let limit = 15;
        if (query.limit && typeof query.limit === 'number' && query.limit <= 50) {
            limit = query.limit;
        }

        const data = await fetchPosts(query.query, tags, page, limit);

        await RedisCache.getInstance().set('posts:list:' + JSON.stringify(query), data);

        if (!data.posts.length) {
            return Response(res, {
                status: 404,
                message: 'post.none_found_by_query'
            }, 404);
        }

        return Response(res, {
            status: 200,
            data: data
        });
    }
}