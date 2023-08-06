import os from "os";
import path from "path";

export const INCLUDES_CONFIG = path.join(
  os.homedir(),
  ".config/synkremote/include"
);

export const EXLCUDES_CONFIG = path.join(
  os.homedir(),
  ".config/synkremote/exclude"
);

export const DEFAULT_REMOTE_DIR = "synkremote";

export const DEFAULT_DIR = `${os.homedir()}/synkremote`;

export const ERRORS = {
  PARSE_CONTENT: "Parse Error! Invalid file name or content.",
  INVALID_FILE: "Not a file.",
  INVALID_DIRECTORY: "Not a directory.",
  INVALID_PATH: "Path does not exist.",
  INVALID_ADDRESS: "Incorrect remote host or port.",
  INCORRECT_PATH: "No file or directory specified",
  NO_SERVER: "Server not ready.",
};

export const HELP =
  "usage: synkremote [--help] [--port <port>]\n\
                  [--bindIp <ipv4>] [--rootDir <dir>]\n\
Run 'synkremote send --help' to show the help section for sending files.";

export const CLIENT_HELP =
  "usage: synkremote send [--help] [--host <host>] [--port <port>]\n\
                       [--addr <host:port>] [--dir <dir-path>] [--file <file-path>]\n\
                       [--remoteDir <dir-name>] [--include <pattern>] [--exclude <pattern>]\n\
Run 'synkremote --help' to show the help section for starting the server.";
