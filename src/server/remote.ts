import { existsSync, mkdirSync, readFileSync } from "fs";
import { open } from "fs/promises";
import protoBuf from "protocol-buffers";
import { createServer } from "net";
import { join, parse } from "path";
import type { Message, ServerArgs } from "../utils/types";
import { DEFAULT_DIR, ERRORS } from "../utils/constants";

const server = (args: ServerArgs): void => {
  const rootDir = args.rootDir || DEFAULT_DIR;
  const port = args.port || 8080;

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
          const file = message.File.decode(Buffer.from(packets), 4, length);

          offset = length + 4;
          packets = packets.subarray(offset);

          if (!file.content || !file.name) {
            throw new Error(ERRORS.PARSE_CONTENT);
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

  const logMessage = `synkremote started on port ${port}`;
  if (args.bindIp) {
    server.listen(port, args.bindIp, () => console.log(logMessage));
  } else {
    server.listen(port, () => console.log(logMessage));
  }
};

export default server;
