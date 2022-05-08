# synkremote

## Description

A CLI tool to share files/directories between remote systems.

## Installation

    npm i --global synkremote

## Usage

### Recieve

The system recieving the files should have the synkremote server running. To start the server, run:


    synkremote


#### Options

| Name      | Description                                                                   | Required                 |
|-----------|-------------------------------------------------------------------------------|--------------------------|
| --port    | The port to start the server on. Defaults to 8080.                            | No |
| --rootDir | The directory where the received files are stored. Defaults to *~/synkremote* | No | 
| --bindIp  | The IPv4 address to bind synkremote to. Binds to *localhost* by default.      | No |
| --help    | Show help                                                                     | -  |

### Send

Synkremote supports sending both files and directories. You can start sending data by running:

    synkremote send

For example, to send the directory *~/my-dir* to a remote system *synkhost.com*, where the synkremote server is running on port *8080*, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir

You can use the *--file* option to send a file.

    synkremote send --addr synkhost.com:8080 --file ~/my-dir/myFile.txt

You can also specify glob patterns to include or exclude files and directories. For example, to just send files ending in *.js*, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir --include "**/*.js"

Similarly, to exclude the files in the *tmp* directory within *~/my-dir*, you can run:

    synkremote send --addr synkhost.com:8080 --dir ~/my-dir --exclude "tmp/*"

You can specfiy multiple patterns in the *include* and *exclude* files respectively. These files must be created in the *~/.config/synkremote* directory.


#### Options

| Name      | Description                                                                                  | Required                 |
|------------|---------------------------------------------------------------------------------------------|--------------------------|
| --addr     | The address of the server receiving the files in the *host:port* format.                    | No |
| --host     | The IPv4 address or hostname of the remote server. An alternative to the --addr option.     | Yes if the *--addr* option is not provided, otherwise no|
| --host     | The port on which the synkremote server is running on the remote server. Defaults to 8080.  | No | 
| --file     | The file to send to the remote server.                                                      | No |
| --dir      | The directory to send to the remote server.                                                 | Yes if the *--file* option is not provided, otherwise no|
| --remoteDir| The name of the directory on the remote server. <br/> Defaults to the current name of the directory if the *--dir* option is provided. <br/> If the *--file* option is provided, defaults to the name of the directory in which the file currently exists.         | No |
| --include  | Glob pattern to specify which files to include. <br/> Defaults to the patterns specified in  the *include* file in *~/.config/synkremote*. <br/> Defaults to *\*\*/\** if the *include* file does not exist.                                                | No |
| --exclude  | Glob pattern to specify which files to exclude. <br/> Defaults to the patterns specified in  the *exclude* file in *~/.config/synkremote*. <br/> Defaults to *null* if the *exclude* file does not exist.                                                   | No |
| --help     | Show help                                                                                   | -  |


## License  

This tool is distributed under the MIT License. See the LICENSE file for more information.