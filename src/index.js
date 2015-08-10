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

const log = ::console.log;

function printStats(corpus: string) {
  log(`Corpus length: ${corpus.length}`);

  const chars = {};
  for (var i = 0, max = corpus.length; i < max; i++) {
    let letter = corpus[i];
    if (letter === ' ') {
      letter = '<space>';
    } else if (letter === '\n') {
      letter = '<newline>';
    }
    chars[letter] = chars[letter] || 0;
    chars[letter]++;
  }
  const sortedChars = Object.keys(chars)
    .sort((a, b) => {
      const diff = chars[b] - chars[a];
      if (diff) {
        return diff;
      } else {
        // Count is same; use lexicographical sort to break tie.
        return a < b ? -1 : 1;
      }
    })
    .map(letter => [letter, chars[letter]]);

  log('Letters by frequency:');
  log('---------------------');
  sortedChars.forEach(([letter, count]) => {
    log(`${letter}: ${count}`);
  });
}

(async function() {
  const json = require('../package');
  let argv = yargs
    .usage('Usage: $0 <command> [options...]')
    .command('corpus-stats', 'show corpus stats', yargs => {
      // TODO: maybe put something here
    })
    .help('h')
    .alias('h', 'help')
    .version(json.version)
    .epilog(json.homepage)
    .strict()
    .argv;

  const command = argv._[0];

  if (command === 'corpus-stats') {
    const corpusPath = path.join('yak', 'corpus.txt');
    const corpus = await readFile(corpusPath);
    printStats(corpus.toString());
  } else {
    yargs.showHelp();
  }
})();
