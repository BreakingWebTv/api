export enum EUserPermission {
    EditPosts = 'edit-posts',
    EditTags = 'edit-tags',

    CreatePosts = 'create-posts',
    CreateTags = 'create-tags',
    CreateComment = 'create-tags',

    DeletePosts = 'delete-posts',
    DeleteTags = 'delete-tags',
}

export interface IPublicConnection {
    source: 'discord';
    username: Nullable<string>;
    avatar: Nullable<string>;
    email: Nullable<string>;
}

export interface IConnection extends IPublicConnection {
    accessToken: Nullable<string>;
    refreshToken: Nullable<string>;
    expires: Nullable<number>;
}

export interface IRawUser {
    displayName: Nullable<string>;
    permissions: EUserPermission[];
    newsLetter: boolean;
    createdAt: string;
}

export interface IUser extends IRawUser {
    _id: string;
    password: string;
    email: string;
    twoFASecret: string;
    connections: IConnection[];
}

export interface IPublicUser extends IRawUser {
    id: string;
    connections: IPublicConnection[];
}