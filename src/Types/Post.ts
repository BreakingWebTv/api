export interface IContent {
    languageKey: string;
    slug: string;
    title: string;
    content: string;
    shortContent: string;
    information: string;
    summary: string;
}

export interface IPostTagName {
    languageKey: string;
    name: string;
}

export interface IPostTag {
    _id: string,
    uniqueName: string,
    names: IPostTagName[],
    creatorId: string,
    createdAt: string,
}

export interface IRawPost {
    uniqueSlug: string;
    uniqueTitle: string;
    contents: IContent[];
    tags: string[];
    creatorId: string;
    createdAt: number;
}

export interface IPost extends IRawPost {
    _id: string;
}

export interface IPublicPost extends IRawPost {
    id: string;
}