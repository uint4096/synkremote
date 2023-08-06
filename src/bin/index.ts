#! /usr/bin/env node

import { existsSync, readFileSync } from "fs";
import minimist from "minimist";
import { EOL } from "os";
import path from "path";
import client from "../client/local";
import server from "../server/remote";
import type { CliArgs } from "../utils/types";
import {
  CLIENT_HELP,
  DEFAULT_REMOTE_DIR,
  ERRORS,
  EXLCUDES_CONFIG,
  HELP,
  INCLUDES_CONFIG,
} from "../utils/constants";

(async () => {
  const validatePattern = (
    type: "include" | "exclude",
    args: CliArgs,
    fallback?: string
  ): Array<string> => {
    const config = type === "include" ? INCLUDES_CONFIG : EXLCUDES_CONFIG;

    const value = args[type];

    if (value) {
      return [value];
    } else if (existsSync(config)) {
      return readFileSync(config, { encoding: "utf-8" })
        .split(EOL)
        .filter(Boolean);
    } else {
      return [fallback].filter(Boolean) as Array<string>;
    }
  };

  try {
    const args = minimist(process.argv.slice(2)) as CliArgs;
    if (args && args["_"].length > 0 && args["_"].includes("send")) {
      if (args.help) {
        console.log(CLIENT_HELP);
        return;
      }

      if (!args.addr && (!args.host || !args.port)) {
        throw new Error(ERRORS.INVALID_ADDRESS);
      } else if (!args.file && !args.dir) {
        throw new Error(ERRORS.INCORRECT_PATH);
      }

      const remoteAddress = args.addr
        ? args.addr
        : args.host && args.port
        ? `${args.host}:${args.port}`
        : "";

      let remoteDir: string;
      if (args.remoteDir) {
        remoteDir = args.remoteDir;
      } else if (args.file) {
        if (!existsSync(args.file)) {
          throw new Error(ERRORS.INVALID_PATH);
        }
        remoteDir = args.file.split(path.sep).slice(-2)[0];
      } else if (args.dir) {
        if (!existsSync(args.dir)) {
          throw new Error(ERRORS.INVALID_PATH);
        }
        remoteDir = args.dir.split(path.sep).slice(-1)[0];
      } else {
        remoteDir = DEFAULT_REMOTE_DIR;
      }

      const clientArgs = {
        addr: remoteAddress,
        remoteDir: remoteDir as string,
        include: validatePattern("include", args, "**/*"),
        exclude: validatePattern("exclude", args),
      };

      if (args.file) {
        await client({ ...clientArgs, file: args.file });
      } else if (args.dir) {
        await client({ ...clientArgs, dir: args.dir });
      }
    } else {
      if (args.help) {
        console.log(HELP);
        return;
      }

      server({
        port: args.port,
        rootDir: args.rootDir,
        bindIp: args.bindIp,
      });
    }
  } catch (err) {
    console.log(err);
  }
})();
