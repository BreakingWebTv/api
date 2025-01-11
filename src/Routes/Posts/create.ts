import type {TIncomingMessage, TRoute, TServerResponse} from "@Types/HttpClient";
import {Response} from "@Utils/Http";
import {EUserPermission} from "@Types/User";
import {validateSlug, validateTags} from "@API/Mongoose";
import {formatPostForPublic, isValidMarkdown, LANGUAGES, sanitizeMarkdown} from "@Utils/Post";
import {DiscordSnowflake} from "@sapphire/snowflake";
import {IContent} from "@Types/Post";
import RedisCache from "@API/RedisCache";
import WebsocketClient from "@API/WebsocketClient";
import RedisQueue from "@API/RedisQueue";
import {ENotificationJobs, EWebsocketWorkerJobs} from "@Types/RedisQueue";
import {Time} from "@Types/Time";

export default class CreatePostRoute implements TRoute {
    method = 'POST';
    path = '/posts/create';

    async execute(req: TIncomingMessage, res: TServerResponse) {
        if (!req.loggedIn || !req.user) {
            return Response(res, {
                status: 401,
                message: 'user.unauthorized',
            }, 401);
        }

        if (!req.user.permissions.includes(EUserPermission.CreatePosts)) {
            return Response(res, {
                status: 401,
                message: 'user.invalid_permissions',
                needed: [EUserPermission.CreatePosts]
            }, 401);
        }

        const body = req.body;
        if (!body) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid',
            }, 400);
        }

        if (!body.uniqueSlug || typeof body.uniqueSlug !== 'string' || body.uniqueSlug.includes(' ') || /^[a-zA-Z0-9_.]{3,20}$/g.test(body.uniqueSlug)) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.unique_slug',
            }, 400);
        }

        if (!body.slug || typeof body.slug !== 'string' || body.slug.includes(' ') || /^[a-zA-Z0-9_.]{3,20}$/g.test(body.slug)) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.unique_slug',
            }, 400);
        }

        const uniqueSlugIsValid = await validateSlug(body.uniqueSlug);
        if (!uniqueSlugIsValid) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.tags',
            }, 400);
        }

        if (!body.tags || !Array.isArray(body.tags) || body.tags.length < 1) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.tags',
            }, 400);
        }

        const tagsAreValid = await validateTags(body.tags);
        if (!tagsAreValid) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.tags',
            }, 400);
        }

        if (!body.contents || !Array.isArray(body.contents) || body.contents.length < 1) {
            return Response(res, {
                status: 401,
                message: 'payload.invalid.contents',
            }, 400);
        }

        const validatedContents: IContent[] = [];
        for (let i = 0; i < body.contents.length; i++) {
            const content = body.contents[i];

            if (!content.languageKey || typeof content.languageKey !== 'string' || !LANGUAGES.find(l => l.id === content.languageKey)) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].languageKey',
                }, 400);
            }

            if (!content.slug || typeof content.slug !== 'string' || content.slug.includes(' ') || /^[a-zA-Z0-9_.]{3,20}$/g.test(content.slug)) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].slug',
                }, 400);
            }

            if (!content.title || typeof content.title !== 'string' || !content.title.trim().lenght) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].content',
                }, 400);
            }

            const uniqueSlugIsValid = await validateSlug(content.slug);
            if (!uniqueSlugIsValid) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].slug',
                }, 400);
            }

            if (!content.content || typeof content.content !== 'string' || !content.content.trim().lenght || !isValidMarkdown(sanitizeMarkdown(content.content))) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].content',
                }, 400);
            }

            if (content.information && (typeof content.information !== 'string' || !content.content.trim().lenght || !isValidMarkdown(sanitizeMarkdown(content.content)))) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].information',
                }, 400);
            }

            if (!content.shortContent || typeof content.shortContent !== 'string' || !content.shortContent.trim().lenght || !isValidMarkdown(sanitizeMarkdown(content.shortContent))) {
                return Response(res, {
                    status: 401,
                    message: 'payload.invalid.content[' + i + '].shortContent',
                }, 400);
            }

            validatedContents.push({
                languageKey: content.languageKey,
                slug: content.slug,
                title: content.title,
                content: content.content,
                shortContent: content.shortContent,
                information: content.information,
            } as IContent)
        }

        const postId = String(DiscordSnowflake.generate());
        const data = {
            _id: postId,
            uniqueSlug: body.uniqueSlug,
            uniqueTitle: body.uniqueTitle,
            contents: validatedContents,
            tags: body.tags,
            creatorId: req.user._id,
            createdAt: Date.now(),
        };

        await RedisCache.getInstance().set('posts:' + data._id, data, Time.Week);
        await RedisCache.getInstance().set('posts:uniqueSlug:' + data.uniqueSlug, data._id, Time.Week);

        for (const content of validatedContents) {
            await RedisCache.getInstance().set('posts:slug:' + content.slug, data._id, Time.Week);
        }

        await RedisQueue.getInstance().addJob(EWebsocketWorkerJobs.ForwardWebsocketEvents, {
            id: 'broadcast',
            payload: {
                o: 'NEW_NEWS',
                d: formatPostForPublic(data)
            }
        });

        await RedisQueue.getInstance().addJob(ENotificationJobs.HandleNewNews, {
            payload: formatPostForPublic(data)
        });

        return Response(res, {
            status: 200,
            message: 'post.created',
        });
    }
}