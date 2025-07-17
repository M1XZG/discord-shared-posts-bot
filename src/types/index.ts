export interface Post {
    id: string;
    content: string;
    authorId: string;
    timestamp: Date;
}

export interface User {
    id: string;
    username: string;
    discriminator: string;
    roles: string[];
}

export interface Command {
    name: string;
    description: string;
    execute: (args: string[], user: User) => Promise<void>;
}