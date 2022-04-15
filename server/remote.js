const { existsSync, mkdirSync, readFileSync } = require("fs");
const protoBuf = require('protocol-buffers');
const { open } = require("fs/promises");
const tcp = require("net");
const { homedir } = require("os");
const { join, parse } = require("path");

const ROOT_APP_DIR = process.argv[2] || `${homedir()}/apps`;
const messages = protoBuf(
    readFileSync("schema.proto")
);

(() => {
    const server = tcp.createServer((socket) => {
        socket.on("connect", () => {
            console.log(`A client connected: ${socket.address()}`);
        });
    
        let buf = Buffer.alloc(0);
        socket.on("data", async (data) => {
            let offset = 0;
            buf = Buffer.concat([buf, data]);
            while (offset < buf.length) {
                const length = buf.readUInt32BE();
                if (buf.length >= length + 4) {
                    const file = messages.File.decode(
                        Buffer.from(buf),
                        4,
                        length
                    );
                    offset = length + 4;
                    buf = buf.slice(offset);
    
                    if (!file.content || !file.name) {
                        throw new Error("Parse Error!");
                    }
    
                    console.log(`Syncing ${file.name}`);
    
                    const filePath = join(`${ROOT_APP_DIR}`, file.name);
                    const directory = parse(filePath).dir;
    
                    if (!existsSync(directory)) {
                        mkdirSync(directory, { recursive: true });
                    }
    
                    const fileHandler = await open(filePath, "a");
                    await fileHandler.write(file.content);
                    await fileHandler.close();

                    console.log(`Synced ${file.name}`);
                } else {
                    break;
                }
            }
        });
    });
    
    server.listen(8080);
})();