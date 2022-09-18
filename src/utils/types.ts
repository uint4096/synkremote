import type { Pattern } from 'fast-glob';
interface File {
    name: string;
}

export interface Image extends File {
    content: string;
    image?: never;
}

export interface Text extends File {
    content?: never;
    image: Buffer;
}

export interface Message {
    File: {
        encode: (file: Text | Image) => Buffer;
        decode: (message: Buffer, offset: number, length: number) => Text | Image;
    }
}

export interface ServerArgs {
    port?: number;
    rootDir?: string;
    bindIp?: string;
    help?: string;
}

type FileArg = {
    file: string;
    dir?: never;
};

type DirArg = {
    dir: string;
    file?: never;
};

export type FileOrDir = DirArg | FileArg;

interface Options {
    addr?: string;
    host?: string;
    port?: string;
    include?: Pattern;
    exclude?: Pattern;
    remoteDir?: string;
    help?: string;
}

export type ClientOptions = Options & FileOrDir;

export type CliArgs = ServerArgs & ClientOptions & { _: Array<string>};

export type ClientArgs = Required<Omit<Options, 'host' | 'port' | 'include' | 'exclude' | 'help'>>
    & {
        include: Array<Pattern>;
        exclude: Array<Pattern>
    }
    & FileOrDir;
