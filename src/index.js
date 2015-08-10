#!/usr/bin/env node

/**
 * Copyright 2015-present Greg Hurrell. All rights reserved.
 * Licensed under the terms of the MIT license.
 *
 * @flow
 */

'use strict';

import 'babel/polyfill';

import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';

const readFile = Promise.promisify(fs.readFile);

process.on('unhandledRejection', reason => {
  throw reason;
});

(async function() {
  const json = require('../package');
  const options = yargs
    .usage('Usage: $0')
    .version(json.version)
    .epilog(json.homepage)
    .strict();
  const config = options.argv;

  const corpusPath = path.join('yak', 'corpus.txt');
  const corpus = await readFile(corpusPath);
})();
