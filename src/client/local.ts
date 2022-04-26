import { readdir, stat } from "fs/promises";
import { createReadStream, readFileSync } from "fs";
import protoBuf from 'protocol-buffers';
import { createConnection, Socket } from "net";
import path from "path";
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

    const remoteDir = args.remoteDir
        ? args.remoteDir
        : args.dir
            ? args.dir.split(path.sep).slice(-1)[0]
            : args.file
                ? args.file.split(path.sep).slice(-2)[0]
                : "";

    const message: Message = protoBuf(
        readFileSync(path.join(__dirname, "../schema.proto"))
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
                name: `${filePath.replace(
                    args.dir || path.dirname(args.file as string),
                    remoteDir
                )}`,
                content: chunk.toString('utf-8')
            });

            const lengthBuf = Buffer.alloc(4);
            lengthBuf.writeUInt32BE(file.length);

            cb(null, Buffer.concat([lengthBuf, file]));
        },
    });

    const dirSync = async (
        directory: string,
        files: Array<string>,
        index: number = 0,
        connection: Socket
    ) => {

        if (!files[index]) {
            return;
        }

        const fileSync = (filePath: string) => {
            return new Promise((resolve, reject) => {
                const readable = createReadStream(filePath, { flags: "r" });
                readable.on("open", () => {
                    console.log(`Reading ${filePath}`);
                });

                readable.on("error", (err) => {
                    console.log(`Error while reading ${filePath}: ${err}`);
                    reject(err.message);
                });

                const transform = createTransformStream(filePath);

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
                    console.log(`Sync initiated for ${filePath}`)
                    resolve('Done!');
                });

                transform.on('close', async () => {
                    if (index + 1 <= files.length - 1) {
                        await dirSync(directory, files, index + 1, connection);
                    }
                });

                readable.pipe(transform);
            });
        }

        const filePath = path.join(directory, files[index]);
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
            const dirFiles = await readdir(filePath);
            await dirSync(filePath, dirFiles, 0, connection);
            if (index + 1 <= files.length - 1) {
                await dirSync(directory, files, index + 1, connection);
            }
        } else {
            fileSync(filePath);
        }
    }

    try {
        if (!args.dir && !args.file) {
            throw new Error("Invalid args!");
        }

        if (args.dir) {
            const stats = await stat(args.dir);
            if (stats.isDirectory()) {
                const files = await readdir(args.dir);
                await dirSync(args.dir, files, 0, connection);
            } else {
                throw new Error("Not a directory!");
            }
        } else if (args.file) {
            const stats = await stat(args.file);
            if (!stats.isDirectory()) {
                const dir = path.dirname(args.file);
                const file = path.basename(args.file);
                await dirSync(dir, [file], 0, connection);
            } else {
                throw new Error("Not a file!");
            }
        }
    } catch (err) {
        console.log(err);
    }
};

export default client;