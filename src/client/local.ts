import { stat } from "fs/promises";
import { createReadStream, existsSync, readFileSync } from "fs";
import protoBuf from 'protocol-buffers';
import { createConnection, Socket } from "net";
import path from "path";
import { Transform } from "stream";
import type { ClientArgs, Message } from "../utils/types";
import fg from 'fast-glob';
import { ERRORS } from "../utils/constants";

const client = async (args: ClientArgs) => {

    const {
        addr,
        file,
        dir,
        remoteDir,
        include,
        exclude
    } = args;

    const message: Message = protoBuf(
        readFileSync(path.join(__dirname, "../schema.proto"))
    );

    const connection = createConnection({
        host: addr.split(":")[0],
        port: parseInt(addr.split(":")[1]),
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

        const filePath = path.join(directory, files[index]);

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

    try {
        if (!connection.readyState) {
            throw new Error(ERRORS.NO_SERVER);
        }

        if (dir) {
            const stats = await stat(dir);
            if (stats.isDirectory()) {
                const files = await fg(include, {
                        cwd: dir,
                        ignore: exclude
                    });

                await dirSync(dir, files, 0, connection);
            } else {
                throw new Error(ERRORS.INVALID_DIRECTORY);
            }
        } else if (file) {
            const stats = await stat(file);
            if (!stats.isDirectory()) {
                const dir = path.dirname(file);
                const fileName = path.basename(file);
                await dirSync(dir, [fileName], 0, connection);
            } else {
                throw new Error(ERRORS.INVALID_FILE);
            }
        }
    } catch (err) {
        console.log(err);
    }
};

export default client;