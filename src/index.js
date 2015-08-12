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

type Key = {
  id: number,
  row: number,
  column: number,
  name: string,
  x: number,
  y: number,
};

type Layout = {
  keys: Array,
  name: string,
};

process.on('unhandledRejection', reason => {
  throw reason;
});

const log = ::console.log;


/**
 * The center of each key is measured in an arbitrary coordinate system (pixels)
 * based on this image:
 *
 * https://support.apple.com/library/content/dam/edam/applecare/images/en_US/keyboards/english_notebook.png
*/
const KEYS = [
  // Row 0.
  {id: 0, row: 0, column: 0, name: 'Esc', x: 126, y: 71},
  {id: 1, row: 0, column: 1, name: 'F1', x: 352, y: 71},
  {id: 2, row: 0, column: 2, name: 'F2', x: 590, y: 71},
  {id: 3, row: 0, column: 3, name: 'F3', x: 816, y: 71},
  {id: 4, row: 0, column: 4, name: 'F4', x: 1052, y: 71},
  {id: 5, row: 0, column: 5, name: 'F5', x: 1286, y: 71},
  {id: 6, row: 0, column: 6, name: 'F6', x: 1514, y: 71},
  {id: 7, row: 0, column: 7, name: 'F7', x: 1750, y: 71},
  {id: 8, row: 0, column: 8, name: 'F8', x: 1978, y: 71},
  {id: 9, row: 0, column: 9, name: 'F9', x: 2216, y: 71},
  {id: 10, row: 0, column: 10, name: 'F10', x: 2450, y: 71},
  {id: 11, row: 0, column: 11, name: 'F11', x: 2678, y: 71},
  {id: 12, row: 0, column: 12, name: 'F12', x: 2914, y: 71},
  {id: 13, row: 0, column: 13, name: 'Power', x: 3136, y: 71},

  // Row 1.
  {id: 14, row: 1, column: 0, name: '~', x: 115, y: 254},
  {id: 15, row: 1, column: 1, name: '1', x: 339, y: 254},
  {id: 16, row: 1, column: 2, name: '2', x: 573, y: 254},
  {id: 17, row: 1, column: 3, name: '3', x: 789, y: 254},
  {id: 18, row: 1, column: 4, name: '4', x: 1015, y: 254},
  {id: 19, row: 1, column: 5, name: '5', x: 1239, y: 254},
  {id: 20, row: 1, column: 6, name: '6', x: 1467, y: 254},
  {id: 21, row: 1, column: 7, name: '7', x: 1691, y: 254},
  {id: 22, row: 1, column: 8, name: '8', x: 1915, y: 254},
  {id: 23, row: 1, column: 9, name: '9', x: 2141, y: 254},
  {id: 24, row: 1, column: 10, name: '0', x: 2359, y: 254},
  {id: 25, row: 1, column: 11, name: '-', x: 2585, y: 254},
  {id: 26, row: 1, column: 12, name: '=', x: 2813, y: 254},
  {id: 27, row: 1, column: 13, name: 'Delete', x: 3092, y: 254},

  // Row 2.
  {id: 28, row: 2, column: 0, name: 'Tab', x: 177, y: 474},
  {id: 29, row: 2, column: 1, name: 'q', x: 455, y: 474},
  {id: 30, row: 2, column: 2, name: 'w', x: 679, y: 474},
  {id: 31, row: 2, column: 3, name: 'e', x: 901, y: 474},
  {id: 32, row: 2, column: 4, name: 'r', x: 1123, y: 474},
  {id: 33, row: 2, column: 5, name: 't', x: 1351, y: 474},
  {id: 34, row: 2, column: 6, name: 'y', x: 1573, y: 474},
  {id: 35, row: 2, column: 7, name: 'u', x: 1799, y: 474},
  {id: 36, row: 2, column: 8, name: 'i', x: 2025, y: 474},
  {id: 37, row: 2, column: 9, name: 'o', x: 2245, y: 474},
  {id: 38, row: 2, column: 10, name: 'p', x: 2471, y: 474},
  {id: 39, row: 2, column: 11, name: '[', x: 2695, y: 474},
  {id: 40, row: 2, column: 12, name: ']', x: 2921, y: 474},
  {id: 41, row: 2, column: 13, name: '\\', x: 3148, y: 474},

  // Row 3 (home row).
  {id: 42, row: 3, column: 0, name: 'Caps Lock', x: 196, y: 692},
  {id: 43, row: 3, column: 1, name: 'a', x: 510, y: 692},
  {id: 44, row: 3, column: 2, name: 's', x: 736, y: 692},
  {id: 45, row: 3, column: 3, name: 'd', x: 958, y: 692},
  {id: 46, row: 3, column: 4, name: 'f', x: 1180, y: 692},
  {id: 47, row: 3, column: 5, name: 'g', x: 1406, y: 692},
  {id: 48, row: 3, column: 6, name: 'h', x: 1631, y: 692},
  {id: 49, row: 3, column: 7, name: 'j', x: 1857, y: 692},
  {id: 50, row: 3, column: 8, name: 'k', x: 2079, y: 692},
  {id: 51, row: 3, column: 9, name: 'l', x: 2301, y: 692},
  {id: 52, row: 3, column: 10, name: ';', x: 2531, y: 692},
  {id: 53, row: 3, column: 11, name: '\'', x: 2749, y: 692},
  {id: 54, row: 3, column: 12, name: 'Return', x: 3057, y: 692},

  // Row 4.
  {id: 55, row: 4, column: 0, name: 'Shift (Left)', x: 259, y: 910},
  {id: 56, row: 4, column: 1, name: 'z', x: 619, y: 910},
  {id: 57, row: 4, column: 2, name: 'x', x: 843, y: 910},
  {id: 58, row: 4, column: 3, name: 'c', x: 1071, y: 910},
  {id: 59, row: 4, column: 4, name: 'v', x: 1293, y: 910},
  {id: 60, row: 4, column: 5, name: 'b', x: 1519, y: 910},
  {id: 61, row: 4, column: 6, name: 'n', x: 1743, y: 910},
  {id: 62, row: 4, column: 7, name: 'm', x: 1965, y: 910},
  {id: 63, row: 4, column: 8, name: ',', x: 2191, y: 910},
  {id: 64, row: 4, column: 9, name: '.', x: 2421, y: 910},
  {id: 65, row: 4, column: 10, name: '/', x: 2643, y: 910},
  {id: 66, row: 4, column: 11, name: 'Shift (Right)', x: 3007, y: 910},

  // Row 5 (never analyzed, but here for completeness).
  {id: 67, row: 5, column: 0, name: 'fn', x: 115, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Control (Left)', x: 333, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Alt (Left)', x: 565, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Command (Left)', x: 817, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Space', x: 1517, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Command (Right)', x: 2221, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Alt (Right)', x: 2469, y: 1138},
  {id: 68, row: 5, column: 1, name: 'Left', x: 2697, y: 1200},  // half-height
  {id: 68, row: 5, column: 1, name: 'Up', x: 2919, y: 1082}, // half-height
  {id: 68, row: 5, column: 1, name: 'Down', x: 2919, y: 1200}, // half-height
  {id: 68, row: 5, column: 1, name: 'Right', x: 3148, y: 1200}, // half-height
];

const FINGER_NAMES = [
  /* 0 */ 'Left Pinkie',
  /* 1 */ 'Left Ring Finger',
  /* 2 */ 'Left Middle Finger',
  /* 3 */ 'Left Index Finger',
  /* 4 */ 'Left Thumb',
  /* 5 */ 'Right Thumb',
  /* 6 */ 'Right Index Finger',
  /* 7 */ 'Right Middle Finger',
  /* 8 */ 'Right Ring Finger',
  /* 9 */ 'Right Pinkie',
];

/**
 * My shockingly unorthodox finger-to-key mappings.
 *
 * Note the almost non-existent use of pinkies, and relatively heavy use of the
 * ring fingers, which are typically regarded as among the least flexible
 * fingers.
 */
const FINGERS_PLACEMENTS = [
  /* Row 0: */ 1, 2, 2, 3, 3, 3, 6, 6, 6, 7, 7, 8, 8, 8,
  /* Row 1: */ 1, 1, 2, 3, 3, 3, 6, 6, 6, 7, 7, 7, 8, 8,
  /* Row 2: */ 1, 1, 1, 2, 3, 3, 6, 6, 7, 7, 8, 8, 8, 8,
  /* Row 3: */ 1, 1, 1, 2, 3, 3, 6, 6, 7, 8, 8, 8, 8,
  /* Row 4: */ 0, 1, 2, 3, 3, 6, 6, 6, 7, 8, 8, 9,
  /* Row 5: */ 0, 0, 4, 4, 5, 5, 5, 6, 7, 7, 8
];

/**
 * The key on which each finger is considered to be in its optimal resting
 * position (ie on the home row).
 */
const FINGER_HOME_KEYS = [
  /* 0: left pinkie */ 3 * 14 + 1,
  /* 1: left ring */ 3 * 14 + 2,
  /* 2: left middle */ 3 * 14 + 3,
  /* 3: left index */ 3 * 14 + 4,
  /* 4: left thumb */ 3 * 14 + 1 * 13 + 5,
  /* 5: right thumb */ 3 * 14 + 1 * 13 + 5,
  /* 6: right index */ 3 * 14 + 7,
  /* 7: right middle */ 3 * 14 + 8,
  /* 8: right ring */ 3 * 14 + 9,
  /* 9: right pinkie */ 3 * 14 + 10,
];

const FINGER_STRENGTHS = [
  /* 0: left pinkie */ 0.1,
  /* 1: left ring */ 0.6,
  /* 2: left middle */ 0.7,
  /* 3: left index */ 0.9,
  /* 4: left thumb */ 0.4,
  /* 5: right thumb */ 0.5,
  /* 6: right index */ 1.0,
  /* 7: right middle */ 0.8,
  /* 8: right ring */ 0.7,
  /* 9: right pinkie */ 0.1,
];

/**
 * This is the "human-readable" version of the layout.
 *
 * Array items are used to represent shifted keys (the first element being the
 * unshifted version and the second element being the shifted version).
 */
const LAYOUTS = {
  Colemak: {
    keys: [
      /* Row 0: */ 'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Power',
      /* Row 1: */ ['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], 'Delete',
      /* Row 2: */ 'Tab', 'q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y', [';', ':'], ['[', '{'], [']', '}'], ['\\', '|'],
      /* Row 3: */ 'Caps Lock', 'a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o', ["'", '"'], 'Return',
      /* Row 4: */ 'Shift (Left)', 'z', 'x', 'c', 'v', 'b', 'k', 'm', [',', '<'], ['.', '>'], ['/', '?'], 'Shift (Right)',
      /* Row 5: */ 'fn', 'Control (Left)', 'Alt (Left)', 'Command (Left)', 'Space', 'Command (Right)', 'Alt (Right)', 'Left', 'Up', 'Down', 'Right',
    ],
    name: 'Colemak',
  },

  Qwerty: {
    keys: [
      /* Row 0: */ 'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Power',
      /* Row 1: */ ['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], 'Delete',
      /* Row 2: */ 'Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', ['[', '{'], [']', '}'], ['\\', '|'],
      /* Row 3: */ 'Caps Lock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', [';', ':'], ["'", '"'], 'Return',
      /* Row 4: */ 'Shift (Left)', 'z', 'x', 'c', 'v', 'b', 'n', 'm', [',', '<'], ['.', '>'], ['/', '?'], 'Shift (Right)',
      /* Row 5: */ 'fn', 'Control (Left)', 'Alt (Left)', 'Command (Left)', 'Space', 'Command (Right)', 'Alt (Right)', 'Left', 'Up', 'Down', 'Right',
    ],
    name: 'Qwerty',
  },
};

const layoutLookupMaps = new Map();

/**
 * Given a "human-readable" layout, return a map for fast look-up from input
 * character to pressed key.
 */
function getLayoutLookupMap(
  layout: Layout
): {[key: string]: {index: number, shift: boolean}} {
  if (!layoutLookupMaps.has(layout.name)) {
    const map = {};
    layout.keys.forEach((key, index) => {
      if (Array.isArray(key)) {
        map[key[0]] = {index, shift: false};
        map[key[1]] = {index, shift: true};
      } else {
        map[key] = {index, shift: false};
      }
    });
    layoutLookupMaps.set(layout.name, map);
  }
  return layoutLookupMaps.get(layout.name);
}

/**
 * Returns the "distance" (in arbitrary units) between keys `a` and `b`.
 */
function getDistance(a: Key, b: Key): number {
  // Via Pythagorean theorem (a^2 + b^2 = c^2).
  return Math.sqrt(
    Math.pow(Math.abs(a.x - b.x), 2) +
    Math.pow(Math.abs(a.y - b.y), 2)
  );
}

/**
 * To compute normalized distances, we need to know the maximum distance of a
 * finger from its home key.
 */
const maximumDistanceFromHomeKey = Math.max(...FINGERS_PLACEMENTS.map((placement, i) => {
  return getDistance(KEYS[i], KEYS[FINGER_HOME_KEYS[placement]]);
}));

/**
 * Also need to know the farthest distance between same-finger keys.
 *
 * (Yes, this is a horrible quadratic algorithm).
 */
const maximumDistanceOnSameFinger = KEYS.reduce((max, key, i) => {
  const finger = FINGERS_PLACEMENTS[i];
  for (let j = 0; j < KEYS.length; j++) {
    if (FINGERS_PLACEMENTS[j] === finger) {
      max = Math.max(max, getDistance(KEYS[i], KEYS[j]));
    }
  }
  return max;
}, 0);

/**
 * Normalizes `value` within the range defined by `minimum` to `maximum` to a
 * scale from 0 to 1.
 */
function normalize(value: number, minimum: number, maximum: number): number {
  // Via: http://stats.stackexchange.com/a/70807
  return (value - minimum) / (maximum - minimum);
}

/**
 * Adjusts the score of a trigram according to any "rolls" that may be present
 * in it.
 *
 * - Inward rolls are favorable, so get strongly boosted.
 * - Outward rolls are less so, so get boosted weakly.
 * - 2-letter rolls that combine alternation score more highly than 2-letter
 *   rolls followed (or preceded) by a key-press on the same hand.
 * - Tighter rolls (ie. ones with minimal column or row jumps) score more
 *   favorably.
 */
function getRollMultiplier(trigram: string, layout: Layout): number {
  return 1;
}

/**
 * Adjusts the score of a trigram according to any contained row jumps.
 *
 * The larger the row jumps, the greater the penalty.
 */
function getRowJumpMultiplier(trigram: string, layout: Layout): number {
  return 1;
}

/**
 * Adjusts the score of a trigram according to any contained column jumps.
 *
 * Small row jumps can be favorable (see `getRollMultiplier`), but large jumps,
 * or jumps involving the same finger, can be costly.
 */
function getColumnJumpMultiplier(trigram: string, layout: Layout): number {
  return 1;
}

/**
 * Adjusts the score of a trigram according involving the use of the same finger
 * to make multiple key-presses.
 *
 * The greater the distance between successive key-presses, the greater the
 * penalty.
 */
function getSameFingerMultiplier(trigram: string, layout: Layout): number {
  const map = getLayoutLookupMap(layout);
  const letters = trigram.split('');
  const keys = letters.map(letter => map[letter].index);
  return keys.reduce((multiplier, key, i) => {
    const fingerA = FINGERS_PLACEMENTS[key];
    const fingerB = FINGERS_PLACEMENTS[keys[i - 1]];
    if (fingerA === fingerB) {
      const distance = normalize(
        getDistance(KEYS[key], KEYS[keys[i - 1]]), 0, maximumDistanceOnSameFinger
      );
      return multiplier * (distance + 1);
    } else {
      // Different fingers; not our concern here.
      return multiplier;
    }
  }, 1);
}

/**
 * Adjusts the score of a trigram according to the position of the keys
 * involved.
 *
 * In general, keys receive a greater penalty the farther they are from the
 * corresponding finger's position on the home row.
 *
 * The adjustment applied here is fairly weak because there are other, more
 * important factors that need to be weighed more heavily (for example, a
 * distant key becomes more accessible if a previous key in the trigram has
 * caused the hand to float towards the subsequent key's region).
 */
function getPositionMultiplier(trigram: string, layout: Layout): number {
  const map = getLayoutLookupMap(layout);
  const letters = trigram.split('');
  const keys = letters.map(letter => map[letter].index);
  const fingers = keys.map(key => FINGERS_PLACEMENTS[key]);
  return fingers.reduce((multiplier, finger, i) => {
    const distance = getDistance(KEYS[keys[i]], KEYS[FINGER_HOME_KEYS[finger]]);
    return multiplier * (normalize(distance, 0, maximumDistanceFromHomeKey) + 1);
  }, 1);
}

/**
 * Modifies the score of a trigram according to the strength of the fingers
 * involved.
 */
function getFingerMultiplier(trigram: string, layout: Layout): number {
  const map = getLayoutLookupMap(layout);
  const letters = trigram.split('');
  const fingers = letters.map(letter => FINGERS_PLACEMENTS[map[letter].index]);
  return fingers.reduce((multiplier, finger) => (
    multiplier * (FINGER_STRENGTHS[finger])
  ), 1);
}

/**
 * Calculates an effort score for the provided `trigram`. Lower scores are
 * better.
 *
 * Each trigram starts off with an initial score of 1, which is adjusted upwards
 * or downwards from there by a series of "multipliers", each considering a
 * particular factor such as finger strength or row jumps etc.
 */
function scoreTrigram(trigram: string, layout: Layout) {
  return [
    getRollMultiplier,
    getRowJumpMultiplier,
    getColumnJumpMultiplier,
    getSameFingerMultiplier,
    getPositionMultiplier,
    getFingerMultiplier,
  ].reduce((score, scorer) => score * scorer(trigram, layout), 1);
}

function getCorpusDistance(layout: Layout, unigrams: Array<string>): number {
  const map = getLayoutLookupMap(layout);
  let distance = 0;
  for (let i = 0, max = unigrams.length; i < max - 1; i++) {
    const a = KEYS[map[getLetterForDisplay(unigrams[i])].index];
    const b = KEYS[map[getLetterForDisplay(unigrams[i + 1])].index];
    distance += getDistance(a, b);
  }
  return distance;
}

function getSortedFingerCounts(fingerCounts) {
  return Object.keys(fingerCounts)
    .sort((a, b) => fingerCounts[b] - fingerCounts[a])
    .map(finger => [finger, fingerCounts[finger]]);
}

function printLayoutStats(layout: Layout, corpus: string) {
  printHeading(`${layout.name} layout stats:`);
  let totalCount = 0;
  const fingerCounts = {};
  const map = getLayoutLookupMap(layout);
  const unigrams = corpus.split('').filter(letter => N_GRAM_REGEXP.test(letter));
  unigrams.forEach(letter => {
    const keyIndex = map[getLetterForDisplay(letter)];
    const fingerIndex = FINGERS_PLACEMENTS[keyIndex.index]; // Ignore Shift for now.
    fingerCounts[fingerIndex] = fingerCounts[fingerIndex] || 0;
    fingerCounts[fingerIndex]++;
    totalCount++;
  });

  const sortedCounts = getSortedFingerCounts(fingerCounts);
  printHeading('Finger utilization:');
  sortedCounts.forEach(([finger, count]) => {
    const percentage = getPercentage(count, totalCount);
    log(`${FINGER_NAMES[finger]}: ${formatNumber(count)} (${percentage})`);
  });

  printHeading('Hand utilization:');
  const hands = sortedCounts.reduce((hands, [finger, count]) => {
    const hand = finger <= 4 ? 'left' : 'right';
    hands[hand] = hands[hand] || 0;
    hands[hand] += count;
    return hands;
  }, {});
  log(`Left: ${formatNumber(hands.left)} (${getPercentage(hands.left, totalCount)})`);
  log(`Right: ${formatNumber(hands.right)} (${getPercentage(hands.right, totalCount)})`);

  printHeading('Distance:');
  const distance = getCorpusDistance(layout, unigrams);
  const normalized = distance / unigrams.length;
  log(`Total: ${formatNumber(distance, 2)} (normalized: ${formatNumber(normalized, 2)})`);

  printHeading('Effort (per trigram):');
  const {nGrams: trigrams} = getNGramFrequencies(corpus, 3);
  const sortedTrigrams = getSortedNGrams(trigrams);
  sortedTrigrams.slice(0, 50).forEach(([key, count]) => {
    const percentage = getPercentage(count, totalCount);
    const score = formatNumber(scoreTrigram(key, layout), 4);
    log(`${getLettersForDisplay(key)}: ${formatNumber(count)} (${percentage}) [score: ${score}]`);
  });

}

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
    return 'Space';
  } else if (letter === '\n') {
    return 'Return';
  } else if (letter === '\t') {
    return 'Tab';
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

function formatNumber(number: number, precision = 0: number): string {
  const [integer, decimal] = (number.toFixed(precision)).split('.');

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

function getPercentage(
  dividend: number, divisor: number, precision = 2: number
): string {
  return (dividend / divisor * 100).toFixed(precision) + '%';
}

function printCorpusStats(corpus: string) {
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
      const percentage = getPercentage(count, totalCount);
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
    .command('layout-stats', 'show layout stats', yargs => {
      // TODO: something?
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
    printCorpusStats(corpus.toString().toLowerCase());
  } else if (command === 'layout-stats') {
    const corpusPath = path.join('yak', 'corpus.txt');
    const corpus = await readFile(corpusPath);
    printLayoutStats(LAYOUTS.Qwerty, corpus.toString().toLowerCase());
    printLayoutStats(LAYOUTS.Colemak, corpus.toString().toLowerCase());
  } else {
    yargs.showHelp();
  }
})();
