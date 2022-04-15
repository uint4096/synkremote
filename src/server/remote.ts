import { existsSync, mkdirSync, readFileSync } from "fs";
import { open } from "fs/promises";
import protoBuf from 'protocol-buffers';
import { createServer } from "net";
import { homedir } from "os";
import { join, parse } from "path";
import type { Message } from "../utils/types";

const ROOT_APP_DIR = process.argv[2] || `${homedir()}/apps`;

(() => {
    const message: Message = protoBuf(
        readFileSync(join(__dirname, "../schema.proto"))
    );

    const server = createServer((socket) => {
        socket.on("connect", () => {
            console.log(`A client connected: ${socket.address()}`);
        });
    
        let packets = Buffer.alloc(0);
        socket.on("data", async (data) => {
            let offset = 0;
            packets = Buffer.concat([packets, data]);
            while (offset < packets.length) {
                const length = packets.readUInt32BE();
                if (packets.length >= length + 4) {
                    const file = message.File.decode(
                        Buffer.from(packets),
                        4,
                        length
                    );
                    offset = length + 4;
                    packets = packets.slice(offset);
    
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