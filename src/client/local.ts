import { stat } from "fs/promises";
import { createReadStream, readFileSync } from "fs";
import protoBuf from "protocol-buffers";
import { createConnection, Socket } from "net";
import path from "path";
import { Transform } from "stream";
import type { ClientArgs, Message } from "../utils/types";
import fg from "fast-glob";
import { ERRORS } from "../utils/constants";

const client = async (args: ClientArgs) => {
  const { addr, file, dir, remoteDir, include, exclude } = args;

  const message: Message = protoBuf(
    readFileSync(path.join(__dirname, "../schema.proto"))
  );

  const createTransformStream = (filePath: string): Transform =>
    new Transform({
      transform(chunk: Buffer, _, cb) {
        const msg: any = {
          name: `${filePath.replace(
            args.dir || path.dirname(args.file as string),
            remoteDir
          )}`,
        };

        msg.content = chunk;
        const file = message.File.encode(msg);

        const lengthBuf = Buffer.alloc(4);
        lengthBuf.writeUInt32BE(file.length);

        cb(null, Buffer.concat([lengthBuf, file]));
      },
    });

  const dirSync = async (directory: string, file: string) => {
    const filePath = path.join(directory, file);
    const connection = createConnection({
      host: addr.split(":")[0],
      port: parseInt(addr.split(":")[1]) || 8080,
    });

    return new Promise((resolve, reject) => {
      connection.on("error", (err) => {
        console.log(err);
        reject(err.message);
      });
      connection.on("finish", () => {
        console.log("Connection closed");
        resolve("Done!");
      });

      const readable = createReadStream(filePath, {
        flags: "r",
        highWaterMark: 64 * 1024,
      });
      readable.on("open", () => {
        console.log(`Reading ${filePath}`);
      });
      readable.on("error", (err) => {
        console.log(`Error while reading ${filePath}: ${err}`);
        reject(err.message);
      });

      const transform = createTransformStream(filePath);
      transform.on("error", (err) => {
        console.log(`Error: ${err}`);
        reject(err.message);
      });

      readable.pipe(transform).pipe(connection);
    });
  };

  try {
    if (dir) {
      const stats = await stat(dir);
      if (stats.isDirectory()) {
        const files = await fg(include, {
          cwd: dir,
          ignore: exclude,
          dot: true,
        });

        for (const file of files) {
          await dirSync(dir, file);
        }
      } else {
        throw new Error(ERRORS.INVALID_DIRECTORY);
      }
    } else if (file) {
      const stats = await stat(file);
      if (!stats.isDirectory()) {
        const dir = path.dirname(file);
        const fileName = path.basename(file);
        await dirSync(dir, fileName);
      } else {
        throw new Error(ERRORS.INVALID_FILE);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export default client;
