import type { Pattern } from 'fast-glob';
interface File {
    content: string;
    name: string;
}

export interface Message {
    File: {
        encode: (file: File) => Buffer;
        decode: (message: Buffer, offset: number, length: number) => File;
    }
}

export interface ServerArgs {
    localPort?: number;
    rootdir?: string;
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
}

export type ClientOptions = Options & FileOrDir;

export type CliArgs = ServerArgs & ClientOptions & { _: Array<string>};

export type ClientArgs = Required<Omit<Options, 'host' | 'port' | 'include' | 'exclude'>>
    & {
        include: Array<Pattern>;
        exclude: Array<Pattern>
    }
    & FileOrDir;
