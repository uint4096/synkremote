import { readdir, stat } from "fs/promises";
import { createReadStream, readFileSync } from "fs";
import protoBuf from 'protocol-buffers';
import { createConnection, Socket } from "net";
import { join } from "path";
import { Transform } from "stream";
import type { Message } from "../utils/types";

const REMOTE_ADDR = process.argv[2];
const LOCAL_DIR = process.argv[3];
const REMOTE_DIR_NAME = process.argv[4];


(async () => {
    const message: Message = protoBuf(
        readFileSync(join(__dirname, "../schema.proto"))
    );

    const connection = createConnection({
        host: REMOTE_ADDR.split(":")[0],
        port: parseInt(REMOTE_ADDR.split(":")[1]),
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
                name: `${filePath.replace(LOCAL_DIR, REMOTE_DIR_NAME)}`,
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
        await recursivelySync(LOCAL_DIR, connection);
    } catch (err) {
        console.log(err);
    }
})();