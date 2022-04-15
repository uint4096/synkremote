const tcp = require("net");
const { homedir } = require("os");

const ROOT_APP_DIR = process.argv[2] || `${homedir()}/apps`;

const server = tcp.createServer((socket) => {
    socket.on("connect", () => {
        console.log(`A client connected: ${socket.address()}`);
    });

    socket.on("data", (chunk) => {
        console.log(Buffer.from(chunk).toString())
    });
});

server.listen(8080);