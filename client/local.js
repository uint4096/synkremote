const { readdir, stat } = require("fs").promises;
const { createReadStream } = require('fs');
const tcp = require("net");
const { join } = require("path");
const { Transform } = require("stream");

const REMOTE_ADDR = process.argv[2];
const LOCAL_DIR = process.argv[3];

(() => {
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
            dirLengthBuf.writeUInt16BE(filePath.length);

            const dirBuf = Buffer.from(filePath, "utf-8");
            console.log(Buffer.from(dirBuf).toString());

            const contentLengthBuf = Buffer.alloc(4);
            contentLengthBuf.writeUInt32BE(chunk.length);

            const data = Buffer.concat([
                dirLengthBuf,
                dirBuf,
                contentLengthBuf,
                chunk
            ]);

            console.log(Buffer.from(data).toString());
            cb(null, data);
        },
    });
    
    const recursivelySync = async (directory, connection) => {

        const fileSync = async (files, index = 0) => {
            const path = join(directory, files[index]);
            const stats = await stat(join(directory, files[index]));
            if (stats.isDirectory()) {
                recursivelySync(path, connection);
            } else {
                const readable = createReadStream(join(directory, files[index]), { flags: "r" });
                const transform = createTransformStream(files[index], connection);

                transform.on("data", (chunk) => {
                    connection.write(chunk);
                });

                transform.on("error", (err) => {
                    console.log(err);
                });

                readable.on("end", () => {
                    console.log(`Stream ended for ${directory}/${files[index]}`);
                });
    
                transform.on("end", () => {
                    if (index + 1 <= files.length - 1) {
                        fileSync(files, index + 1);
                    } else {
                        console.log(`All files synced for directory: ${directory}`);
                    }
                });

                transform.on('close', () => {
                    console.log("Stream closed");
                });

                readable.pipe(transform);
            }
        }

        const stats = await stat(directory);
        if (stats.isDirectory()) {
            const files = await readdir(directory);
            fileSync(files);
        } 
    }

    recursivelySync(LOCAL_DIR, connection);
})();