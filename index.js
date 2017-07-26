#!/usr/bin/env node

'use strict';

const Program = require('commander');
const Hapi = require('hapi');
const Path = require('path');

Program.version(require('./package.json').version).usage('command');

Program
  .command('start')
  .description('Start the upload server.')
  .option('-h, --host [host]', 'Host for the server. Defaults to localhost.')
  .option('-p, --port [port]', 'Port to listen on. Defaults to 8989.')
  .option('-s, --store [path]', 'Folder were uploads are stored. Defaults to cwd.')
  .option('-u, --uploadRoute [path]', 'Path of the upload route. Defaults to /upload.')
  .option('-m, --maxKb [kb]', 'Maximum file size in kilobytes. Defaults to 5120 KB.')
  .option('--image-processing [config file]', 'Process uploaded images. Supply path to config file for processing.')
  .action(function(opt) {
    const options = {
      host: opt.host || 'localhost',
      port: parseInt(opt.port, 10) || 8989,
      store: opt.store || process.cwd(),
      uploadRoute: opt.uploadRoute || '/upload',
      maxKb: opt.maxKb || 5120,
      imageProcessing: opt.imageProcessing || null
    };

    const server = new Hapi.Server();
    server.connection({ port: options.port, host: options.host });

    server.route({
      method: 'POST',
      path: options.uploadRoute,
      handler: require('./handler')(options),
      config: {
        cors: {
          origin: [ '*' ],
          headers: [ 'x-access-token', 'Accept', 'Authorization', 'Content-Type', 'If-None-Match' ]
        },
        payload: {
          maxBytes: 1024 * options.maxKb,
          allow: 'multipart/form-data',
          output: 'stream',
          parse: true,
        }
      }
    });

    server.start((err) => {
      if (err) {
        throw err;
      }
      console.log(`Upload your files to ${server.info.uri}${options.uploadRoute}`);
      console.log(`Files are saved in ${Path.resolve(options.store)}`);
      console.log();
    });
  });

Program.parse(process.argv);

if (!process.argv.slice(2).length) {
  Program.outputHelp();
}
