import { existsSync, mkdirSync, readFileSync } from "fs";
import { open } from "fs/promises";
import protoBuf from 'protocol-buffers';
import { createServer } from "net";
import { join, parse } from "path";
import type { Message, ServerArgs } from "../utils/types";
import { DEFAULT_DIR } from "../utils/constants";

const server = (args: ServerArgs): void => {

    const rootDir = args.rootdir || DEFAULT_DIR;
    const port = args.localPort || 8080;

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

                    const filePath = join(`${rootDir}`, file.name);
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

    server.listen(port, () => {
        console.log(`SynkRemote started on port ${port}`);
    });
};

export default server;
