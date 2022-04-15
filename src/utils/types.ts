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