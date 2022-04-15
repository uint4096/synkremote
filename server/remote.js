const tcp = require("net");
const { homedir } = require("os");

const ROOT_APP_DIR = process.argv[2] || `${homedir()}/apps`;

const server = tcp.createServer((socket) => {
    socket.on("connect", () => {
        console.log(`A client connected: ${socket.address()}`);
    });

    socket.on("data", (chunk) => {
        let n = 0;
        while (n < chunk.length) {
            const dirLength = chunk.readUint16BE(n);

            const dirOffsetStart = n + 2;
            const dirOffsetEnd = dirOffsetStart + dirLength;
            const dir = chunk.toString("utf-8", dirOffsetStart, dirOffsetEnd);

            const fileLength = chunk.readUint32BE(dirOffsetEnd);

            const fileOffsetStart = dirOffsetEnd + 4;
            const fileOffsetEnd = fileOffsetStart + fileLength;
            const file = chunk.toString("utf-8", fileOffsetStart, fileOffsetEnd);

            console.log(dir, file);

            n = fileOffsetEnd;
        }
    });
});

server.listen(8080);