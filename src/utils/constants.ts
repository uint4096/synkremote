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

export const ERRORS = {
    PARSE_CONTENT: "Parse Error! Invalid file name or content." ,
    INVALID_FILE: "Not a file.",
    INVALID_DIRECTORY: "Not a directory.",
    INVALID_PATH: "Path does not exist.",
    INVALID_ADDRESS: "Incorrect remote host or port.",
    INCORRECT_PATH: "No file or directory specified",
    NO_SERVER: "Server not ready."
}
