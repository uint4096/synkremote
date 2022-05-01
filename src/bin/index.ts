#! /usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import minimist from 'minimist';
import { EOL } from 'os';
import path from 'path';
import client from '../client/local';
import server from '../server/remote';
import type { CliArgs } from '../utils/types';
import { DEFAULT_REMOTE_DIR, EXLCUDES_CONFIG, INCLUDES_CONFIG } from '../utils/constants';

(async () => {
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

            let include: Array<string>;
            if (args.include) {
                include = [args.include];
            } else if (existsSync(INCLUDES_CONFIG)) {
                include = readFileSync(
                    INCLUDES_CONFIG,
                    { encoding: 'utf-8' }
                )
                .split(EOL)
                .filter(Boolean);
            } else {
                include = ['**/*'];
            }

            let exclude: Array<string>;
            if (args.exclude) {
                exclude = [args.exclude];
            } else if (existsSync(EXLCUDES_CONFIG)) {
                exclude = readFileSync(
                    EXLCUDES_CONFIG,
                    { encoding: 'utf-8' }
                )
                .split(EOL)
                .filter(Boolean);
            } else {
                exclude = [];
            }

            const clientArgs = {
                addr: remoteAddress,
                remoteDir: remoteDir,
                include: include,
                exclude: exclude,
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