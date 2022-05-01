import os from 'os';
import path from 'path';

export const INCLUDES_CONFIG = path.join(
    os.homedir(),
    ".config/synkremote/include" 
);

export const EXLCUDES_CONFIG = path.join(
    os.homedir(),
    ".config/synkremote/exclude" 
);

export const DEFAULT_REMOTE_DIR = 'synkremote';

export const DEFAULT_DIR = `${os.homedir()}/synkremote`;
