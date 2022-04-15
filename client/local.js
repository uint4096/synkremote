const { createReadStream } = require("fs");
const tcp = require("net");

const REMOTE_ADDR = process.argv[2];
const LOCAL_DIR = process.argv[3];

const connection = tcp.createConnection({
    host: REMOTE_ADDR.split(":")[0],
    port: REMOTE_ADDR.split(":")[1]
});

const ReadableStream = createReadStream(LOCAL_DIR, { flags: "r" });

ReadableStream.pipe(connection);