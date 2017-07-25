# upload-test-server

Small node server with a CLI to test file uploads.
Powered by [hapi](https://hapijs.com).

## Why?

I searched for a simple and easy server that does just one thing:  
Letting me test file uploads with front end gui stuff I work on.

## Install

`npm install -g upload-test-server`

## Run it

`upload-test-server start`

Starts the server on localhost:8989 and accepts file uploads at http://localhost:8989/upload.  
By default all uploaded files are saved to the current working directory.  
If the upload folder doesn't exist, it's created as soon as a file is uploaded.

[See options for more](#server-options)

The server accepts any origin, so you shouldn't have any trouble with cors.  
**This also means don't use this stuff in production!**

## General usage

```
Usage: upload-test-server command


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    start [options]  Start the upload server.
  ```

## Server options

```
Usage: start [options]

  Start the upload server.


  Options:

    -h, --host [host]         Host for the server. Defaults to localhost.
    -p, --port [port]         Port to listen on. Defaults to 8989.
    -s, --store [path]        Folder were uploads are stored. Defaults to cwd.
    -u, --uploadRoute [path]  Path of the upload route. Defaults to /upload.
    -m, --maxKb [kb]          Maximum file size in kilobytes. Defaults to 5120 KB.
    -h, --help                output usage information
```

**Example**

Run at 127.0.0.1, port 1337, save uploads in ~/some/path. Upload url is http://127.0.0.1/uploadHere and the maximal accepted file size is 10240kb (10MB).

`upload-test-server start -h 127.0.0.1 -p 1337 -s ~/some/path -u /uploadHere -m 10240`
