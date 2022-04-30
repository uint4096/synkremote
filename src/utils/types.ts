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

export interface ClientArgs {
    addr?: string;
    host?: string;
    port?: string;
    dir?: string;
    file?: string;
    include?: Pattern;
    exclude?: Pattern;
    remoteDir?: string;
}