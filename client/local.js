const { readdir, stat } = require("fs").promises;
const protoBuf = require('protocol-buffers');
const { createReadStream, readFileSync } = require('fs');
const tcp = require("net");
const { join } = require("path");
const { Transform } = require("stream");

const REMOTE_ADDR = process.argv[2];
const LOCAL_DIR = process.argv[3];
const REMOTE_DIR_NAME = process.argv[4];

const messages = protoBuf(
    readFileSync("schema.proto")
);

(async () => {
    const connection = tcp.createConnection({
        host: REMOTE_ADDR.split(":")[0],
        port: REMOTE_ADDR.split(":")[1],
    });

    connection.on("error", (err) => {
        console.log(err);
    });

    connection.on('close', () => {
        console.log("Connection closed");
    });

    const createTransformStream = (filePath) => new Transform({
        objectMode: true,
        transform (chunk, _, cb) {
            const file = messages.File.encode({
                name: `${filePath.replace(LOCAL_DIR, REMOTE_DIR_NAME)}`,
                content: chunk.toString('utf-8')
            });

            const lengthBuf = Buffer.alloc(4);
            lengthBuf.writeUInt32BE(file.length);

            cb(null, Buffer.concat([lengthBuf, file]));
        },
    });

    const recursivelySync = async (directory, connection) => {

        const fileSync = async (files, index = 0) => {
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

                    const transform = createTransformStream(path, connection);

                    transform.on("data", (chunk) => {
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