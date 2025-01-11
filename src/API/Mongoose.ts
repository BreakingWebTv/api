import mongoose from 'mongoose';
import Logger from '@Utils/Logger';
import {IUser} from "@Types/User";
import {formatUser} from "@Utils/User";
import User from "@Schemas/User";
import {DiscordSnowflake} from '@sapphire/snowflake';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Tag from "@Schemas/Tag";
import Post from "@Schemas/Post";
import {formatPost, formatPostForPublic, formatTag} from "@Utils/Post";
import {IPost, IPostTag, IPublicPost} from "@Types/Post";
import RedisCache from "@API/RedisCache";
import {Time} from "@Types/Time";

export default async function createMongooseConnection() {
    await mongoose.connect(process.env.DATABASE_URL);

    mongoose.set('strictQuery', false);

    mongoose.connection.on('connected', () => {
        Logger.info('Connected to MongoDB database', 'DATABASE');
    });

    mongoose.connection.on('error', (error) => {
        Logger.error(`Error connecting to MongoDB database: ${error}`, 'DATABASE');
    });

    mongoose.connection.on('disconnected', () => {
        Logger.warn('Disconnected from MongoDB database', 'DATABASE');
    });

    return true;
}

export async function getUser(email: string, password: string, twoFACode: string | null = null): Promise<Nullable<IUser | string>> {
    const user = await User.findOne({
        email,
        password
    }).lean();

    if (user) {
        if (user.twoFASecret) {
            if (!twoFACode) {
                return 'user.login.error.missing_2fa';
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token: twoFACode,
            });

            if (!verified) {
                return 'user.login.error.invalid_2fa';
            }
        }

        return formatUser(user);
    }

    return null;
}

export async function getUserById(id: string): Promise<Nullable<IUser>> {
    const user = await User.findById(id).lean();

    if (user) {
        return formatUser(user);
    }

    return null;
}

export async function getUserByConnection(source: string, id: string): Promise<Nullable<IUser>> {
    const user = await User.findOne({
        'connections.source': source,
        'connections.id': id
    }).lean();

    if (user) {
        return formatUser(user);
    }

    return null;
}

export async function deleteUser(email: string, password: string): Promise<void> {
    await User.deleteOne({
        email,
        password
    });
}

export async function checkUserExists(email: string): Promise<boolean> {
    return !!(await User.exists({
        email,
    }).lean());
}

export async function createUser(displayName: string, email: string, password: string, newsLetter: boolean = false): Promise<void> {
    await User.create({
        _id: String(DiscordSnowflake.generate()),
        displayName,
        email,
        password,
        connections: [],
        permissions: [],
        newsLetter,
        twoFASecret: null,
        createdAt: new Date()
    });
}

export async function createUserByConnection(source: string, sourceId: string, username: string, avatar: string, email: string, accessToken: string, refreshToken: string, expires: number): Promise<void> {
    await User.create({
        _id: String(DiscordSnowflake.generate()),
        displayName: username,
        email,
        password: 'by-' + source,
        connections: [{
            source,
            id: sourceId,
            username,
            avatar,
            email,
            accessToken,
            refreshToken,
            expires
        }],
        twoFASecret: null,
        permissions: [],
        newsLetter: true,
        createdAt: new Date()
    });
}

export async function setPasswordOfUser(id: string, password: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
        password
    });
}

export async function enableTwoFA(id: string, password: string): Promise<string | {
    secret: string,
    dataUrl: string
}> {
    const user = await User.findOne({
        _id: id,
        password
    }).lean();

    if (user) {
        if (user.twoFASecret) {
            return 'user.2fa_already_enabled';
        }

        const secret = speakeasy.generateSecret({
            name: 'BreakingWeb.tv',
            issuer: 'BreakingWeb',
            length: 20
        });

        const dataUrl = await QRCode.toDataURL(`otpauth://totp/breakingweb.tv?secret=${secret.base32}&issuer=BreakingWeb`);

        await User.findByIdAndUpdate(id, {
            twoFASecret: secret.base32
        });

        return {
            secret: secret.base32,
            dataUrl
        };
    }

    return 'user.not_existing_or_password_wrong';
}

export async function addConnectionToUser(id: string, source: string, sourceId: string, username: string, avatar: string, email: string, accessToken: string, refreshToken: string, expires: number): Promise<void> {
    await User.findByIdAndUpdate(id, {
        $push: {
            connections: {
                source,
                id: sourceId,
                username,
                avatar,
                email,
                accessToken,
                refreshToken,
                expires
            }
        }
    });
}

export async function validateTags(tags: string[]): Promise<boolean> {
    if (!tags || tags.length === 0) return true;

    const tagsFromCache = await RedisCache.getInstance().get<IPostTag[]>('tags');
    if (tagsFromCache) {
        const validTagIds = new Set(tagsFromCache.map(tag => tag._id.toString()));

        return tags.every(tag => validTagIds.has(tag));
    }

    const tagsFromDatabase = await Tag.find({_id: {$in: tags}}).select('_id').lean();
    if (!tagsFromDatabase.length) return false;

    const validTags = tagsFromDatabase.map(tag => {
        return formatTag(tag);
    });

    await RedisCache.getInstance().set('tags', validTags, Time.Day);

    const validTagIds = new Set(validTags.map(tag => tag._id.toString()));

    return tags.every(tag => validTagIds.has(tag));
}

export async function validateSlug(slug: string, inContent: boolean = false): Promise<boolean> {
    if (!inContent) {
        return !!(await Post.exists({uniqueSlug: slug}).lean());
    }

    return !!(await Post.exists({'contents.slug': slug}).lean());
}

export async function fetchPost(query: string): Promise<Nullable<IPost>> {
    const post = await Post.findOne({
        $or: [
            {_id: query},
            {uniqueSlug: query},
            {uniqueTitle: query},
            {'contents.slug': query},
            {'contents.title': query}
        ]
    });

    if (post) {
        return formatPost(post);
    }

    return null;
}

export async function fetchPosts(query: string, tags: string[], page: number = 0, limit: number = 15): Promise<{
    posts: IPublicPost[],
    hasMore: boolean
}> {
    const filter = {
        $and: [
            {
                $or: [
                    {_id: query},
                    {uniqueSlug: query},
                    {'contents.slug': query},
                    {'contents.title': query}
                ]
            },
            tags.length > 0 ? {tags: {$all: tags}} : {}
        ]
    };

    const posts = await Post.find(filter)
        .skip(page * limit)
        .limit(limit + 1)
        .lean();

    const hasMore = posts.length > limit;

    return {
        posts: (
            hasMore
                ? posts.slice(0, limit)
                : posts
        ).map(formatPostForPublic),
        hasMore
    };
}