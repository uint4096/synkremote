import { readdir, stat } from "fs/promises";
import { createReadStream, readFileSync } from "fs";
import protoBuf from 'protocol-buffers';
import { createConnection, Socket } from "net";
import path, { join } from "path";
import { Transform } from "stream";
import type { ClientArgs, Message } from "../utils/types";

const client = async (args: ClientArgs) => {

    if (!args.addr && (!args.host || !args.port)) {
        throw new Error("Incorrect remote host or port!");
    } else if (!args.dir && !args.file) {
        throw new Error("No file or directory specified");
    }

    const remoteAddress = args.addr
        ? args.addr
        : args.host && args.port
            ? `${args.host}:${args.port}`
            : '';

    const resolver = args.dir || args.file;
    const remoteDir = args.remoteDir
        ? args.remoteDir
        : resolver
            ? resolver.split(path.sep).slice(-1)[0]
            : '';

    const message: Message = protoBuf(
        readFileSync(join(__dirname, "../schema.proto"))
    );

    const connection = createConnection({
        host: remoteAddress.split(":")[0],
        port: parseInt(remoteAddress.split(":")[1]),
    });

    connection.on("error", (err) => {
        console.log(err);
    });

    connection.on('close', () => {
        console.log("Connection closed");
    });

    const createTransformStream = (filePath: string): Transform => new Transform({
        transform (chunk: Buffer, _, cb) {
            const file = message.File.encode({
                name: `${filePath.replace(args.dir as string, remoteDir)}`,
                content: chunk.toString('utf-8')
            });

            const lengthBuf = Buffer.alloc(4);
            lengthBuf.writeUInt32BE(file.length);

            cb(null, Buffer.concat([lengthBuf, file]));
        },
    });

    const recursivelySync = async (directory: string, connection: Socket) => {

        const fileSync = async (files: Array<string>, index: number = 0) => {
            if (!files[index]) {
                return;
            }
            const path = join(directory, files[index]);
            const stats = await stat(path);
            if (stats.isDirectory()) {
                await recursivelySync(path, connection);
                if (index + 1 <= files.length - 1) {
                    await fileSync(files, index + 1);
                }
            } else {
                return new Promise((resolve, reject) => {
                    const readable = createReadStream(path, { flags: "r" });
                    readable.on("open", () => {
                        console.log(`Reading ${path}`);
                    });

                    readable.on("error", (err) => {
                        console.log(`Error while reading ${path}: ${err}`);
                        reject(err.message);
                    });

                    const transform = createTransformStream(path);

                    transform.on("data", (chunk: Buffer) => {
                        const written = connection.write(chunk);
                        if (!written) {
                            console.log("Buffer exceeded limit.");
                            transform.pause();
                            connection.once('drain', () => {
                                transform.resume();
                            });
                        }
                    });

                    transform.on("error", (err) => {
                        console.log(`Error: ${err}`);
                        reject(err.message);
                    });

                    transform.on("end", () => {
                        console.log(`Sync initiated for ${path}`)
                        resolve('Done!');
                    });

                    transform.on('close', async () => {
                        if (index + 1 <= files.length - 1) {
                            await fileSync(files, index + 1);
                        }
                    });

                    readable.pipe(transform);
                });
            }
        }

        const stats = await stat(directory);
        if (stats.isDirectory()) {
            try {
                const files = await readdir(directory);
                await fileSync(files);
            } catch (err) {
                console.log(err);
            }
        } else {
            throw new Error("Not a directory!")
        }
    }

    try {
        if (args.dir) {
            await recursivelySync(args.dir, connection);
        }
    } catch (err) {
        console.log(err);
    }
};

export default client;