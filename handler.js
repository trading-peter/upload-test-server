'use strict';

const Fs = require('fs');
const Boom = require('boom');
const Path = require('path');
const FsExtra = require('fs-extra');
const Magic = require('mmmagic');
const Sharp = require('sharp');
const Hoek = require('hoek');
const MimeMagic = new Magic.Magic(Magic.MAGIC_MIME_TYPE);
const Joi = require('joi');

module.exports = function(options) {
  return function(request, reply) {
    try {
      FsExtra.mkdirsSync(options.store);
      const keys = Object.keys(request.payload);
      const fileObj = request.payload[keys[0]];
      const destPath = Path.resolve(Path.join(options.store, fileObj.hapi.filename));
      const fileStream = Fs.createWriteStream(destPath);

      fileStream.on('finish', async function () {
        const info = { filename: fileObj.hapi.filename, path: destPath };
        info.mime = await getMime(destPath);

        if (options.imageProcessing) {
          const result = await processImage({ filename: fileObj.hapi.filename, path: destPath, mime: info.mime }, require(Path.resolve(options.imageProcessing)));
          if (result.meta) {
            info.meta = result.meta;
          }
        }
        console.log(`Saved file: "${destPath}"`);
        return reply(info);
      });
      
      fileObj.pipe(fileStream);
    } catch (err) {
      console.log(err);
      return reply(Boom.badRequest(err));
    }
  };
};

function processImage(file, config) {
  return new Promise(async function(resolve) {
    validateImageConfig(config);

    const output = {};

    if ([ 'image/jpeg', 'image/png' ].indexOf(file.mime) === -1) {
      return resolve({});
    }
    
    if (config.resize) {
      await resize(file, config);
    }

    if (config.thumbnails) {
      await thumbs(file, config);
    }

    if (config.meta) {
      const meta = await Sharp(file.path).metadata();
      output.meta = meta;
    }

    return resolve(output);
  });
}

function thumbs(file, config) {
  const imgPromises = [];

  for (let i = 0; i < config.thumbnails.length; i++) {
    const size = config.thumbnails[i];

    const thumbPath = Path.join(Path.dirname(file.path), size.toString());
    FsExtra.mkdirsSync(thumbPath);

    imgPromises.push(
      Sharp(file.path)
        .resize(null, size)
        .max()
        .toFile(Path.join(thumbPath, file.filename))
    );
  }

  return Promise.all(imgPromises);
}

function resize(file, config) {
  return new Promise((resolve, reject) => {
    Sharp(file.path)
      .resize(config.resize.maxWidth, config.resize.maxHeight)
      .withoutEnlargement()
      .max()
      .toBuffer(function(err, outputBuffer) {
        if (err) {
          throw err;
        }

        const tmpPath = Hoek.uniqueFilename(Path.dirname(file.path), Path.extname(file.filename).toLowerCase());

        Fs.writeFile(file.path, outputBuffer, function(err) {
          if (err) throw err;
          return resolve();
        });
      });
  });
}

function validateImageConfig(config) {
  Joi.assert(config, Joi.object({
    resize: Joi.object({
      maxWidth: Joi.number().required(),
      maxHeight: Joi.number().required()
    }),
    thumbnails: Joi.array().items(
      Joi.number().required()
    ),
    meta: Joi.boolean()
  }));
}

function getMime(path) {
  return new Promise((resolve, reject) => {
    MimeMagic.detectFile(path, function(err, result) {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });
}