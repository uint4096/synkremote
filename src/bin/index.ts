#! /usr/bin/env node

import minimist from 'minimist';
import client from '../client/local';
import server from '../server/remote';
import type { ClientArgs, ServerArgs } from '../utils/types';

(() => {
    const args: ServerArgs & ClientArgs & { _: Array<string>} = minimist(process.argv.slice(2));
    if (args && args['_'].length > 0 && args['_'].includes('send')) {
        const clientArgs: Array<keyof ClientArgs> = [
            'addr',
            'host',
            'port',
            'dir',
            'file',
            'remoteDir',
            'include',
            'exclude'
        ];

        client(clientArgs.reduce<ClientArgs>((a, v) => (a[v] = args[v], a), {}));
    } else {
        server({
            localPort: args.localPort,
            rootdir: args.rootdir
        });
    }
})();