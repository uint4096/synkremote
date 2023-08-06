# synkremote

## Description

A CLI tool to share files/directories between remote systems.

## Installation

    npm i --global synkremote

## Usage

### Receive

The system receiving the files should have the synkremote server running. To start the server, run:

    synkremote --bindIp=<server_ip>

#### Options

| Name      | Description                                                                   | Required |
| --------- | ----------------------------------------------------------------------------- | -------- |
| --port    | The port to start the server on. Defaults to 8080.                            | No       |
| --rootDir | The directory where the received files are stored. Defaults to _~/synkremote_ | No       |
| --bindIp  | The IPv4 address to bind synkremote to. Binds to _localhost_ by default.      | No       |
| --help    | Show help                                                                     | -        |

### Send

Synkremote supports sending both files and directories. You can start sending data by running:

    synkremote send

For example, to send the directory _~/my-dir_ to a remote system _synkhost.com_, where the synkremote server is running on port _8080_, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir

You can use the _--file_ option to send a file.

    synkremote send --addr synkhost.com:8080 --file ~/my-dir/myFile.txt

You can also specify glob patterns to include or exclude files and directories. For example, to just send files ending in _.js_, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir --include "**/*.js"

Similarly, to exclude the files in the _tmp_ directory within _~/my-dir_, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir --exclude "tmp/*"

You can specfiy multiple patterns in the _include_ and _exclude_ files respectively. These files must be created in the _~/.config/synkremote_ directory.

#### Options

| Name        | Description                                                                                                                                                                                                                                                | Required                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| --addr      | The address of the server receiving the files in the _host:port_ format.                                                                                                                                                                                   | No                                                       |
| --host      | The IPv4 address or hostname of the remote server. An alternative to the --addr option.                                                                                                                                                                    | Yes if the _--addr_ option is not provided, otherwise no |
| --port      | The port on which the synkremote server is running on the remote server. Defaults to 8080.                                                                                                                                                                 | No                                                       |
| --file      | The file to send to the remote server.                                                                                                                                                                                                                     | No                                                       |
| --dir       | The directory to send to the remote server.                                                                                                                                                                                                                | Yes if the _--file_ option is not provided, otherwise no |
| --remoteDir | The name of the directory on the remote server. <br/> Defaults to the current name of the directory if the _--dir_ option is provided. <br/> If the _--file_ option is provided, defaults to the name of the directory in which the file currently exists. | No                                                       |
| --include   | Glob pattern to specify which files to include. <br/> Defaults to the patterns specified in the _include_ file in _~/.config/synkremote_. <br/> Defaults to \*\*\*/\** if the *include\* file does not exist.                                              | No                                                       |
| --exclude   | Glob pattern to specify which files to exclude. <br/> Defaults to the patterns specified in the _exclude_ file in _~/.config/synkremote_. <br/> Defaults to _null_ if the _exclude_ file does not exist.                                                   | No                                                       |
| --help      | Show help                                                                                                                                                                                                                                                  | -                                                        |

## License

This tool is distributed under the MIT License. See the LICENSE file for more information.
