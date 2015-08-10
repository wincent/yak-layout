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

function escapeRegExp(string: string): string {
  // From:
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPrintableASCII(): string {
  let ascii = '';
  for (let i = 32; i <= 127; i++) {
    ascii += String.fromCharCode(i);
  }
  return ascii;
}

const N_GRAM_CHARACTER_CLASS = '[' + escapeRegExp(getPrintableASCII()) + ']';
const N_GRAM_REGEXP = new RegExp('^' + N_GRAM_CHARACTER_CLASS + '+$', 'gi');
const WHITESPACE_REGEXP = new RegExp('[ \t\n]');

function isValidNGram(nGram: string): boolean {
  return !WHITESPACE_REGEXP.test(nGram) && N_GRAM_REGEXP.test(nGram);
}

function getNGramFrequencies(
  corpus: string, n: number
): {nGrams: {[ngram: string]: number}, totalCount: number} {
  const nGrams = {};
  let totalCount = 0;
  for (var i = 0, max = corpus.length - n + 1; i < max; i++) {
    const nGram = corpus.substr(i, n);
    if (isValidNGram(nGram)) {
      nGrams[nGram] = nGrams[nGram] || 0;
      nGrams[nGram]++;
      totalCount++;
    }
  }
  return {nGrams, totalCount};
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

function formatNumber(number: number): string {
  const [integer, decimal] = (number + '').split('.');

  // Borrow trick from ActiveSupport, using positive lookahead (?=) and negative
  // lookahead (?!).
  const delimited = integer.replace(
    /(\d)(?=(\d\d\d)+(?!\d))/g,
    (_, group) => group + ','
  );

  if (decimal) {
    return [delimited, decimal].join('.');
  } else {
    return delimited;
  }
}

function printStats(corpus: string) {
  log(`Corpus length: ${formatNumber(corpus.length)} bytes`);

  const {nGrams: unigrams, totalCount: unigramCount} = getNGramFrequencies(corpus, 1);
  const {nGrams: bigrams, totalCount: bigramCount} = getNGramFrequencies(corpus, 2);
  const {nGrams: trigrams, totalCount: trigramCount} = getNGramFrequencies(corpus, 3);

  const sortedUnigrams = getSortedNGrams(unigrams)
    .filter(([key, count]) => key !== ' ');
  const sortedBigrams = getSortedNGrams(bigrams);
  const sortedTrigrams = getSortedNGrams(trigrams);

  [
    {label: 'Unigrams', nGrams: sortedUnigrams, top: 100, totalCount: unigramCount},
    {label: 'Bigrams', nGrams: sortedBigrams, top: 50, totalCount: bigramCount},
    {label: 'Trigrams', nGrams: sortedTrigrams, top: 50, totalCount: trigramCount},
  ].forEach(({label, nGrams, top, totalCount}) => {
    const total = nGrams.length;
    top = Math.min(top, total);
    printHeading(`${label} by frequency (top ${top} of ${formatNumber(total)}):`);
    nGrams.slice(0, top).forEach(([key, count]) => {
      const percentage = (count / totalCount * 100).toFixed(2) + '%';
      log(`${getLettersForDisplay(key)}: ${formatNumber(count)} (${percentage})`);
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
    printStats(corpus.toString().toLowerCase());
  } else {
    yargs.showHelp();
  }
})();
