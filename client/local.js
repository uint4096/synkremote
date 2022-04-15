const { readdir, stat } = require("fs").promises;
const { createReadStream } = require('fs');
const tcp = require("net");
const { join, basename } = require("path");
const { Transform } = require("stream");

const REMOTE_ADDR = process.argv[2];
const LOCAL_DIR = process.argv[3];
const REMOTE_DIR_NAME = process.argv[4];

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

    connection.on('drain', () => {
        console.log("Connection drained");
    });

    const createTransformStream = (filePath) => new Transform({
        objectMode: true,
        transform (chunk, _, cb) {
            const dirLengthBuf = Buffer.alloc(2);
            const address = join(`${REMOTE_DIR_NAME}`, basename(filePath));
            dirLengthBuf.writeUInt16BE(address.length);

            const dirBuf = Buffer.from(address, "utf-8");

            const contentLengthBuf = Buffer.alloc(4);
            contentLengthBuf.writeUInt32BE(chunk.length);

            const data = Buffer.concat([
                dirLengthBuf,
                dirBuf,
                contentLengthBuf,
                chunk
            ]);

            cb(null, data);
        },
    });

    const recursivelySync = async (directory, connection) => {

        const fileSync = async (files, index = 0) => {
            const path = join(directory, files[index]);
            const stats = await stat(path);
            if (stats.isDirectory()) {
                await recursivelySync(path, connection);
                await fileSync(files, index + 1);
            } else {
                return new Promise((resolve, reject) => {
                    const readable = createReadStream(path, { flags: "r" });
                    readable.on("open", () => {
                        console.log(`Syncing ${path}`);
                    });

                    readable.on("error", (err) => {
                        console.log(`Error while reading: ${err}`);
                        reject(err.message);
                    });

                    const transform = createTransformStream(path, connection);

                    transform.on("data", (chunk) => {
                        connection.write(chunk);
                    });

                    transform.on("error", (err) => {
                        console.log(`Error: ${err}`);
                        reject(err.message);
                    });

                    transform.on("end", () => {
                        console.log(`Synced ${path}`)
                        resolve('Done!');
                    });

                    transform.on('close', async () => {
                        if (index + 1 <= files.length - 1) {
                            await fileSync(files, index + 1);
                        } else {
                            console.log(`All files synced for directory: ${directory}`);
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