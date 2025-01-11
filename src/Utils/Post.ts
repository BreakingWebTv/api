import {IContent, IPost, IPostTag, IPostTagName, IPublicPost} from "@Types/Post";

export const LANGUAGES: { id: string, name: string, nativeName: string }[] = [
    {id: "id", name: "Indonesian", nativeName: "Bahasa Indonesia"},
    {id: "da", name: "Danish", nativeName: "Dansk"},
    {id: "de", name: "German", nativeName: "Deutsch"},
    {id: "en-GB", name: "English, UK", nativeName: "English, UK"},
    {id: "en-US", name: "English, US", nativeName: "English, US"},
    {id: "es-ES", name: "Spanish", nativeName: "Español"},
    {id: "es-419", name: "Spanish, LATAM", nativeName: "Español, LATAM"},
    {id: "fr", name: "French", nativeName: "Français"},
    {id: "hr", name: "Croatian", nativeName: "Hrvatski"},
    {id: "it", name: "Italian", nativeName: "Italiano"},
    {id: "lt", name: "Lithuanian", nativeName: "Lietuviškai"},
    {id: "hu", name: "Hungarian", nativeName: "Magyar"},
    {id: "nl", name: "Dutch", nativeName: "Nederlands"},
    {id: "no", name: "Norwegian", nativeName: "Norsk"},
    {id: "pl", name: "Polish", nativeName: "Polski"},
    {id: "pt-BR", name: "Portuguese, Brazilian", nativeName: "Português do Brasil"},
    {id: "ro", name: "Romanian, Romania", nativeName: "Română"},
    {id: "fi", name: "Finnish", nativeName: "Suomi"},
    {id: "sv-SE", name: "Swedish", nativeName: "Svenska"},
    {id: "vi", name: "Vietnamese", nativeName: "Tiếng Việt"},
    {id: "tr", name: "Turkish", nativeName: "Türkçe"},
    {id: "cs", name: "Czech", nativeName: "Čeština"},
    {id: "el", name: "Greek", nativeName: "Ελληνικά"},
    {id: "bg", name: "Bulgarian", nativeName: "български"},
    {id: "ru", name: "Russian", nativeName: "Pусский"},
    {id: "uk", name: "Ukrainian", nativeName: "Українська"},
    {id: "hi", name: "Hindi", nativeName: "हिन्दी"},
    {id: "th", name: "Thai", nativeName: "ไทย"},
    {id: "zh-CN", name: "Chinese, China", nativeName: "中文"},
    {id: "ja", name: "Japanese", nativeName: "日本語"},
    {id: "zh-TW", name: "Chinese, Taiwan", nativeName: "繁體中文"},
    {id: "ko", name: "Korean", nativeName: "한국어"},
];

export function isValidMarkdown(input: string): boolean {
    const htmlTagRegex = /<[^>]*>/g;
    if (htmlTagRegex.test(input)) {
        return false;
    }

    const jsInjectionRegex = /(javascript:|<script.*?>.*?<\/script.*?>)/gi;
    if (jsInjectionRegex.test(input)) {
        return false;
    }

    const dangerousPatternRegex = /on\w+=['"]?.*?['"]?/gi;
    return !dangerousPatternRegex.test(input);
}

export function sanitizeMarkdown(input: string): string {
    const sanitized = input.replace(/<[^>]*>/g, '');

    const scriptCleaned = sanitized.replace(/javascript:|<script.*?>.*?<\/script.*?>/gi, '');

    return scriptCleaned.trim();
}

export function formatPostForPublic(post: any): IPublicPost {
    return {
        id: post._id,
        uniqueSlug: post.uniqueSlug,
        uniqueTitle: post.uniqueTitle,
        contents: post.contents.map((content: IContent) => {
            return {
                languageKey: content.languageKey,
                slug: content.slug,
                title: content.title,
                content: content.content,
                shortContent: content.shortContent,
                information: content.information,
            }
        }),
        tags: post.tags,
        creatorId: post.creatorId,
        createdAt: post.createdAt,
    }
}

export function formatPost(post: any): IPost {
    return {
        _id: post._id,
        uniqueSlug: post.uniqueSlug,
        uniqueTitle: post.uniqueTitle,
        contents: post.contents.map((content: IContent) => {
            return {
                languageKey: content.languageKey,
                slug: content.slug,
                title: content.title,
                content: content.content,
                shortContent: content.shortContent,
                information: content.information,
            }
        }),
        tags: post.tags,
        creatorId: post.creatorId,
        createdAt: post.createdAt,
    }
}

export function formatTag(tag: any): IPostTag {
    return {
        _id: tag._id,
        uniqueName: tag.uniqueName,
        names: tag.names.map((name: IPostTagName) => {
            return {
                languageKey: name.languageKey,
                name: name.name,
            }
        }),
        creatorId: tag.creatorId,
        createdAt: tag.createdAt,
    }
}