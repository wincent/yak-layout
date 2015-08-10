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

const HEADING =
  '----------------------------------------' +
  '----------------------------------------';

function printHeading(string: string): void {
  const length = string.length;
  log('\n' + string);
  log(HEADING.slice(0, length));
}

function getLettersForDisplay(letters: string) {
  return letters
    .split('')
    .map(letter => getLetterForDisplay(letter))
    .join('');
}

function getLetterForDisplay(letter: string) {
  if (letter === ' ') {
    return '<space>';
  } else if (letter === '\n') {
    return '<newline>';
  } else if (letter === '\t') {
    return '<tab>';
  } else {
    return letter;
  }
}

function getNGramFrequencies(corpus: string, n: number) {
  const nGrams = {};
  for (var i = 0, max = corpus.length - n + 1; i < max; i++) {
    const nGram = corpus.substr(i, n);
    nGrams[nGram] = nGrams[nGram] || 0;
    nGrams[nGram]++;
  }
  return nGrams;
}

function getSortedNGrams(
  nGrams: {[nGram: string]: number}
): Array<Array<string, number>> {
  return Object.keys(nGrams)
    .sort((a, b) => {
      const diff = nGrams[b] - nGrams[a];
      if (diff) {
        return diff;
      } else {
        // Count is same; use lexicographical sort to break tie.
        return a < b ? -1 : 1;
      }
    })
    .map(key => [key, nGrams[key]]);
}


function printStats(corpus: string) {
  log(`Corpus length: ${corpus.length}`);

  const unigrams = getNGramFrequencies(corpus, 1);
  const bigrams = getNGramFrequencies(corpus, 2);
  const trigrams = getNGramFrequencies(corpus, 3);

  const sortedUnigrams = getSortedNGrams(unigrams);
  const sortedBigrams = getSortedNGrams(bigrams);
  const sortedTrigrams = getSortedNGrams(trigrams);

  [
    {label: 'Unigrams', nGrams: sortedUnigrams, count: 100},
    {label: 'Bigrams', nGrams: sortedBigrams, count: 50},
    {label: 'Trigrams', nGrams: sortedTrigrams, count: 50},
  ].forEach(({label, nGrams, count}) => {
    const total = nGrams.length;
    count = Math.min(count, total);
    printHeading(`${label} by frequency (top ${count} of ${total}):`);
    nGrams.slice(0, count).forEach(([key, count]) => {
      log(`${getLettersForDisplay(key)}: ${count}`);
    });
  });

  const overview = sortedUnigrams
    .map(([key, count]) => getLetterForDisplay(key))
    .filter(letter => letter.length === 1)
    .join('')
  printHeading('Unigrams frequency overview:');
  log(overview);
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
