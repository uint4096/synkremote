#! /usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import minimist from 'minimist';
import { EOL } from 'os';
import path from 'path';
import client from '../client/local';
import server from '../server/remote';
import type { CliArgs } from '../utils/types';
import {
    DEFAULT_REMOTE_DIR,
    EXLCUDES_CONFIG,
    INCLUDES_CONFIG
} from '../utils/constants';

(async () => {

    const validatePattern = (
        type: 'include' | 'exclude',
        args: CliArgs,
        defaultValue?: string
    ): Array<string> => {
        const config = type === 'include'
            ? INCLUDES_CONFIG
            : EXLCUDES_CONFIG;

        const value = args[type];

        if (value) {
            return [value];
        } else if (existsSync(config)) {
            return readFileSync(
                config,
                { encoding: 'utf-8' }
            )
            .split(EOL)
            .filter(Boolean);
        } else {
            return [defaultValue].filter(Boolean) as Array<string>;
        }
    }

    try {
        const args = minimist(process.argv.slice(2)) as CliArgs;
        if (args && args['_'].length > 0 && args['_'].includes('send')) {

            if (!args.addr && (!args.host || !args.port)) {
                throw new Error("Incorrect remote host or port!");
            } else if (!args.file && !args.dir) {
                throw new Error("No file or directory specified");
            }

            const remoteAddress = args.addr
                ? args.addr
                : args.host && args.port
                    ? `${args.host}:${args.port}`
                    : '';

            let remoteDir: string;
            if (args.remoteDir) {
                remoteDir = args.remoteDir;
            } else if (args.dir) {
                remoteDir = args.dir.split(path.sep).slice(-1)[0]
            } else if (args.file) {
                remoteDir = args.file.split(path.sep).slice(-2)[0]
            } else {
                remoteDir = DEFAULT_REMOTE_DIR;
            }

            const clientArgs = {
                addr: remoteAddress,
                remoteDir: remoteDir as string,
                include: validatePattern('include', args, '**/*'),
                exclude: validatePattern('exclude', args),
            };

            if (args.file) {
                await client({ ...clientArgs, file: args.file });
            } else if (args.dir) {
                await client({ ...clientArgs, dir: args.dir });
            }
        } else {
            server({
                localPort: args.localPort,
                rootdir: args.rootdir
            });
        }
    } catch(err) {
        console.log(err);
    }
})();