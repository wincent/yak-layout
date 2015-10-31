#!/usr/bin/env node

/**
 * Copyright 2015-present Greg Hurrell. All rights reserved.
 * Licensed under the terms of the MIT license.
 *
 * @flow
 */

'use strict';

import 'babel-core/polyfill';

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

/**
 * Allows us to generate intermediate layouts with unique names.
 */
let layoutCounter = 0;

process.on('unhandledRejection', reason => {
  throw reason;
});

const log = ::console.log;

function print(string: string): void {
  process.stdout.write(string);
}

/**
 * The center of each key is measured in an arbitrary coordinate system (pixels)
 * based on this image:
 *
 * https://support.apple.com/library/content/dam/edam/applecare/images/en_US/keyboards/english_notebook.png
 */
const KEYS = [
  // Row 0.
  {id: 0, row: 0, column: 0, name: '⎋', x: 126, y: 71},
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
  {id: 13, row: 0, column: 13, name: '⌽', x: 3136, y: 71},

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
  {id: 27, row: 1, column: 13, name: '⌫', x: 3092, y: 254},

  // Row 2.
  {id: 28, row: 2, column: 0, name: '⇥', x: 177, y: 474},
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
  {id: 42, row: 3, column: 0, name: '⇪', x: 196, y: 692},
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
  {id: 54, row: 3, column: 12, name: '↩', x: 3057, y: 692},

  // Row 4.
  {id: 55, row: 4, column: 0, name: '⇧ (Left)', x: 259, y: 910},
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
  {id: 66, row: 4, column: 11, name: '⇧ (Right)', x: 3007, y: 910},

  // Row 5 (never analyzed, but here for completeness).
  {id: 67, row: 5, column: 0, name: 'fn', x: 115, y: 1138},
  {id: 68, row: 5, column: 1, name: '⌃ (Left)', x: 333, y: 1138},
  {id: 68, row: 5, column: 1, name: '⌥ (Left)', x: 565, y: 1138},
  {id: 68, row: 5, column: 1, name: '⌘ (Left)', x: 817, y: 1138},
  {id: 68, row: 5, column: 1, name: '␣', x: 1517, y: 1138},
  {id: 68, row: 5, column: 1, name: '⌘ (Right)', x: 2221, y: 1138},
  {id: 68, row: 5, column: 1, name: '⌥ (Right)', x: 2469, y: 1138},
  {id: 68, row: 5, column: 1, name: '←', x: 2697, y: 1200},  // half-height
  {id: 68, row: 5, column: 1, name: '↑', x: 2919, y: 1082}, // half-height
  {id: 68, row: 5, column: 1, name: '↓', x: 2919, y: 1200}, // half-height
  {id: 68, row: 5, column: 1, name: '→', x: 3148, y: 1200}, // half-height
];

/**
 * Keys marked with a 1 won't be considered for moves.
 *
 * For now, only consider moving letters.
 */
const MASK = [
  /* Row 0: */ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  /* Row 1: */ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  /* Row 2: */ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  /* Row 3: */ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  /* Row 4: */ 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  /* Row 5: */ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
];

const ROWS = [
  /* Row 0: */ 'F-keys',
  /* Row 1: */ 'Number',
  /* Row 2: */ 'Top',
  /* Row 3: */ 'Middle',
  /* Row 4: */ 'Bottom',
  /* Row 5: */ 'Modifers/Space',
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
  /* Row 0: */ 0, 0, 1, 2, 3, 3, 6, 6, 7, 8, 9, 9, 9, 9,
  /* Row 1: */ 0, 0, 1, 2, 3, 3, 6, 6, 7, 8, 9, 9, 9, 9,
  /* Row 2: */ 0, 0, 1, 2, 3, 3, 6, 6, 7, 8, 9, 9, 9, 9,
  /* Row 3: */ 0, 0, 1, 2, 3, 3, 6, 6, 7, 8, 9, 9, 9,
  /* Row 4: */ 0, 0, 1, 2, 3, 6, 6, 7, 8, 9, 9, 9,
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
  COLEMAK: {
    keys: [
      /* Row 0: */ '⎋', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '⌽',
      /* Row 1: */ ['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], '⌫',
      /* Row 2: */ '⇥', 'q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y', [';', ':'], ['[', '{'], [']', '}'], ['\\', '|'],
      /* Row 3: */ '⇪', 'a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o', ["'", '"'], '↩',
      /* Row 4: */ '⇧ (Left)', 'z', 'x', 'c', 'v', 'b', 'k', 'm', [',', '<'], ['.', '>'], ['/', '?'], '⇧ (Right)',
      /* Row 5: */ 'fn', '⌃ (Left)', '⌥ (Left)', '⌘ (Left)', '␣', '⌘ (Right)', '⌥ (Right)', '←', '↑', '↓', '→',
    ],
    name: 'Colemak',
  },

  QWERTY: {
    keys: [
      /* Row 0: */ '⎋', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '⌽',
      /* Row 1: */ ['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], '⌫',
      /* Row 2: */ '⇥', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', ['[', '{'], [']', '}'], ['\\', '|'],
      /* Row 3: */ '⇪', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', [';', ':'], ["'", '"'], '↩',
      /* Row 4: */ '⇧ (Left)', 'z', 'x', 'c', 'v', 'b', 'n', 'm', [',', '<'], ['.', '>'], ['/', '?'], '⇧ (Right)',
      /* Row 5: */ 'fn', '⌃ (Left)', '⌥ (Left)', '⌘ (Left)', '␣', '⌘ (Right)', '⌥ (Right)', '←', '↑', '↓', '→',
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
 * And biggest distance between keys on the keyboard (as a pretty good
 * approximation, using the top-left and bottom-right keys).
 */
const maximumDistanceBetweenKeys = getDistance(KEYS[0], KEYS[KEYS.length - 1]);

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
 * - Outward rolls are unfavorable, so get penalized weakly.
 * - 2-letter rolls that combine alternation score more highly than 2-letter
 *   rolls followed (or preceded) by a key-press on the same hand.
 * - Tighter rolls (ie. ones with less distance) score more favorably.
 */
function getRollMultiplier(trigram: string, layout: Layout): number {
  const map = getLayoutLookupMap(layout);
  const letters = trigram.split('');
  const keys = letters.map(letter => KEYS[map[letter].index]);

  let handAlternations = 0;
  let inwardRolls = 0;
  let outwardRolls = 0;

  for (let i = 1; i < keys.length; i++) {
    const fingerA = FINGERS_PLACEMENTS[keys[i - 1].id];
    const fingerB = FINGERS_PLACEMENTS[keys[i].id];
    const columnA = keys[i - 1].column;
    const columnB = keys[i].column;
    if (fingerA === fingerB) {
      continue;
    } else if (
      fingerA <= 4 && fingerB >= 5 ||
      fingerA >= 5 && fingerB <= 4
    ) {
      handAlternations++;
    } else if (
      columnA < columnB && fingerB <= 4 ||
      columnA > columnB && fingerA >= 5
    ) {
      const distance = getDistance(keys[i - 1], keys[i]);
      inwardRolls += 1 - normalize(distance, 0, maximumDistanceBetweenKeys);
    } else if (
      columnA > columnB && fingerB <= 4 ||
      columnA < columnB && fingerA >= 5
    ) {
      const distance = getDistance(keys[i - 1], keys[i]);
      outwardRolls += 1 - normalize(distance, 0, maximumDistanceBetweenKeys);
    }
  }
  return (
    1 +
    (handAlternations ? handAlternations * -0.2 : 0) +
    (outwardRolls ? outwardRolls * 0.2 : 0) +
    (inwardRolls ? inwardRolls * -0.5 : 0)
  );
}

/**
 * Adjusts the score of a trigram according to any contained row jumps.
 *
 * The larger the row jumps, the greater the penalty.
 */
function getRowJumpMultiplier(trigram: string, layout: Layout): number {
  const map = getLayoutLookupMap(layout);
  const letters = trigram.split('');
  const keys = letters.map(letter => KEYS[map[letter].index]);
  let rowsJumped = 0;
  for (let i = 1; i < keys.length; i++) {
    rowsJumped += Math.abs(keys[i].row - keys[i - 1].row);
  }
  const maximumJump = 10; // Worst case is is row 0 -> row 5 -> row 0.
  const dampener = 0.5; // We don't want this to overwhelm roll boost.
  return 1 + normalize(rowsJumped, 0, maximumJump) * dampener;
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

const SCORE_MULTIPLIERS = [
  getRollMultiplier,
  getRowJumpMultiplier,
  getSameFingerMultiplier,
  getPositionMultiplier,
  getFingerMultiplier,
];

/**
 * Calculates an effort score for the provided `trigram`. Lower scores are
 * better.
 *
 * Each trigram starts off with an initial score of 1, which is adjusted upwards
 * or downwards from there by a series of "multipliers", each considering a
 * particular factor such as finger strength or row jumps etc.
 */
function scoreTrigram(trigram: string, layout: Layout) {
  return SCORE_MULTIPLIERS
    .reduce((score, scorer) => score * scorer(trigram, layout), 1);
}

function getSortedFingerCounts(fingerCounts) {
  return Object.keys(fingerCounts)
    .sort((a, b) => fingerCounts[b] - fingerCounts[a])
    .map(finger => [finger, fingerCounts[finger]]);
}

function repeat(string: string, length: number): string {
  while (string.length < length) {
    string += string;
  }
  return string.slice(0, length);
}

function leftAlign(string: string, width: number): string {
  if (string.length < width) {
    return string + repeat(' ', width - string.length);
  } else {
    return string.slice(0, width);
  }
}

function rightAlign(string: string, width: number): string {
  if (string.length < width) {
    return repeat(' ', width - string.length) + string;
  } else {
    return string.slice(0, width);
  }
}

function getBar(count: number, total: number, width: number): string {
  return (
    '|' +
    repeat('-', Math.floor(count / total * width)) +
    'o' +
    repeat(' ', Math.floor((total - count) / total * width)) +
    '|'
  );
}

function printHistogram(
  rows: Array<{label: string, count: number}>,
  total: number
): void {
  const terminalWidth = process.stdout.columns || 80;
  const labelWidth = Math.max(...rows.map(row => row.label.length)) + 2;
  const counts = rows.map(row => formatNumber(row.count));
  const countWidth = Math.max(...counts.map(count => count.length)) + 1;
  const percentages = rows.map(row => getPercentage(row.count, total));
  const percentageWidth = Math.max(...percentages.map(percentage => percentage.length)) + 3;
  const barWidth = Math.max(
    10,
    Math.min(80, terminalWidth - labelWidth - countWidth - percentageWidth - 2)
  );

  rows.forEach((row, i) => {
    print(rightAlign(`${row.label}: `, labelWidth));
    print(rightAlign(`${counts[i]} `, countWidth));
    print(leftAlign(`(${percentages[i]}) `, percentageWidth));
    log(getBar(row.count, total, barWidth));
  });
}

function printLayoutStats(layout: Layout, corpus: string) {
  printHeading(`${layout.name} layout stats:`);
  let totalCount = 0;
  const fingerCounts = {};
  const rowCounts = {};
  const map = getLayoutLookupMap(layout);
  const unigrams = corpus.split('').filter(letter => getNGramRegExp().test(letter));
  unigrams.forEach(letter => {
    const keyIndex = map[getLetterForDisplay(letter)];
    const fingerIndex = FINGERS_PLACEMENTS[keyIndex.index]; // Ignore Shift for now.
    fingerCounts[fingerIndex] = fingerCounts[fingerIndex] || 0;
    fingerCounts[fingerIndex]++;
    const row = KEYS[keyIndex.index].row;
    rowCounts[row] = rowCounts[row] || 0;
    rowCounts[row]++;
    totalCount++;
  });

  printHeading('Finger utilization:');
  printHistogram(
    Object.keys(fingerCounts).map(finger => ({
      label: FINGER_NAMES[finger],
      count: fingerCounts[finger],
    })),
    totalCount
  );

  printHeading('Hand utilization:');
  const hands = Object.keys(fingerCounts).reduce((hands, finger) => {
    const count = fingerCounts[finger];
    let hand;
    // Exclude the thumb.
    if (finger < 4) {
      hand = 'left';
    } else if (finger > 5) {
      hand = 'right';
    } else {
      return hands;
    }
    hands[hand] = hands[hand] || 0;
    hands[hand] += count;
    return hands;
  }, {});
  printHistogram([
      {label: 'Left', count: hands.left},
      {label: 'Right', count: hands.right},
    ],
    totalCount
  );

  printHeading('Row usage:');
  printHistogram(
    Object.keys(rowCounts).map(row => ({
      label: `Row ${row} (${ROWS[row]})`,
      count: rowCounts[row],
    })),
    totalCount
  );

  printHeading('Effort (per trigram):');
  const {nGrams: trigrams} = getNGramFrequencies(corpus, 3);
  const sortedTrigrams = getSortedNGrams(trigrams);
  let totalEffort = 0;
  sortedTrigrams.slice(0, 50).forEach(([key, count]) => {
    const percentage = getPercentage(count, totalCount);
    const score = scoreTrigram(key, layout);
    const total = score * count;
    totalEffort += total;
    log(`${getLettersForDisplay(key)}: ${formatNumber(count)} (${percentage}) [score: ${formatNumber(score, 4)}, total: ${formatNumber(total)}]`);
  });
  log(`Total effort: ${formatNumber(totalEffort)}`);

  printHeading('Summary:');
  SCORE_MULTIPLIERS.forEach(multiplier => {
    let overallCount = 0;
    const total = sortedTrigrams.slice(0, 50).reduce((total, [key, count]) => {
      const score = multiplier(key, layout);
      overallCount += count;
      return total + score * count;
    }, 0);
    log(`${multiplier.name}: ${formatNumber(total / overallCount, 4)}`);
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
    return '␣';
  } else if (letter === '\n') {
    return '↩';
  } else if (letter === '\t') {
    return '⇥';
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

function getNGramRegExp() {
  // Avoid JavaScript RegExp treachery.
  N_GRAM_REGEXP.lastIndex = 0;
  return N_GRAM_REGEXP;
}

function isValidNGram(nGram: string): boolean {
  return !WHITESPACE_REGEXP.test(nGram) && getNGramRegExp().test(nGram);
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

/**
 * Returns the "fitness" of a layout for typing the corpus represented by
 * `trigrams`.
 *
 * "fitness" corresponds to total typing effort, so lower scores are better.
 */
function getFitness(layout: Layout, trigrams: Array): number {
  let totalEffort = 0;
  trigrams.slice(0, 100).forEach(([key, count]) => {
    const score = scoreTrigram(key, layout);
    const total = score * count;
    totalEffort += total;
  });
  return totalEffort;
}

/**
 * Returns the count of keys (pairs of keys) that should be swapped, with some
 * random probability.
 */
function getSwapCount(): number {
  const random = Math.random();
  if (random < 0.9) {
    return 1;
  } else if (random < 0.99) {
    return 2;
  } else {
    return 3;
  }
}

/**
 * Given a `layout`, generate a digest that serves as (an almost certainly)
 * unique fingerprint for it, and can be used to detect duplicate layouts.
 */
function getLayoutDigest(layout: Layout): string {
  return layout.keys.reduce((digest, key) => digest + key, '');
}

/**
 * Pretty-prints `layout` in human-readable form.
 */
function printLayout(layout: Layout): void {
  let lastRow = null;
  KEYS.forEach(({row, column}, i) => {
    const entry = layout.keys[i];
    const key = Array.isArray(entry) ? entry[0] : entry;
    if (row !== lastRow) {
      lastRow = row;
      if (row) {
        print('\n');
      }
    }
    if (column) {
      print('  ');
    }
    if (/^F\d+$/.test(key)) {
      // This makes row 0 too long, but so be it.
      print(key.slice(0, 3));
    } else {
      print(key.slice(0, 1));
    }
  });
  print('\n');
}


function swapKeys(
  layout: Layout,
  sourceIndex: number,
  targetIndex: number
): void {
  const temp = layout.keys[targetIndex];
  layout.keys[targetIndex] = layout.keys[sourceIndex];
  layout.keys[sourceIndex] = temp;
}

function checkNoOps(
  layout: Layout,
  seen: Object,
  sourceIndex: number,
  targetIndex: number
): boolean {
  return (sourceIndex !== targetIndex);
}

function checkDuplicates(
  layout: Layout,
  seen: Object,
  sourceIndex: number,
  targetIndex: number
): boolean {
  // Must apply the mutation in order to get the new digest.
  const testLayout = {
    keys: layout.keys.slice(),
    name: `Test layout ${layoutCounter++}`,
  };
  swapKeys(testLayout, sourceIndex, targetIndex);
  return !seen[getLayoutDigest(testLayout)];
}

function checkMaskedKeys(
  layout: Layout,
  seen: Object,
  sourceIndex: number,
  targetIndex: number
) {
  return (
    MASK[sourceIndex] !== 1 &&
    MASK[targetIndex] !== 1
  );
  return true;
}

function anneal(
  delta: number,
  iteration: number,
  iterationCount: number
): boolean {
  // Based on explanation at: http://mkweb.bcgsc.ca/carpalx/?simulated_annealing
  const t = 250000 * Math.exp(-iteration * 10 / iterationCount);
  const p = Math.exp(-delta / t);
  return Math.random() < p;
}

function now(): number {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds + nanoseconds / 1000000000;
}

function optimize(
  layout: Layout,
  sortedTrigrams: Array,
  iterationCount: number
): Layout {
  log(`Optimizing ${layout.name}:`);
  const start = now();
  let fitness = getFitness(layout, sortedTrigrams);
  let bestFitness = fitness;
  let bestLayout = layout;
  log(`Starting fitness: ${formatNumber(fitness, 2)}`);
  const seen = {[getLayoutDigest(layout)]: true};
  for (let i = 0; i < iterationCount; i++) {
    log(`Iteration ${formatNumber(i)}:`);
    let evolvedLayout = evolve(layout, seen);
    if (!evolvedLayout) {
      continue;
    }
    printLayout(evolvedLayout);
    const evolvedFitness = getFitness(evolvedLayout, sortedTrigrams);
    print(`Fitness: ${formatNumber(evolvedFitness, 2)} `);
    if (evolvedFitness < fitness) {
      log('[better » accepting]');
      fitness = evolvedFitness;
      layout = evolvedLayout;
    } else if (anneal(evolvedFitness - fitness, i, iterationCount)) {
      log('[worse » accepting]');
      fitness = evolvedFitness;
      layout = evolvedLayout;
    } else {
      log('[worse » rejecting]');
    }

    if (fitness < bestFitness) {
      bestFitness = fitness;
      bestLayout = layout;
    }
  }
  log('Final layout:');
  printLayout(bestLayout);
  log(`Final fitness: ${formatNumber(bestFitness, 2)}`);
  const finish = now();
  const elapsed = finish - start;
  console.log(`Elapsed time: ${formatNumber(elapsed, 2)}s`);
}

/**
 * Takes `layout` and applies a random mutation to it, returning a new layout.
 *
 * Takes a `seen` hash recording which layouts have previously been considered.
 * Updates the hash.
 */
function evolve(layout: Layout, seen: Object): ?Layout {
  const evolved = {
    // NOTE: not a deep clone, so for now we swap shifted/unshifted values of
    // each key together in lock-step.
    keys: layout.keys.slice(),
    name: `Random layout ${layoutCounter++}`,
  };

  // Will swap 1, 2 or 3 pairs of keys.
  let swapCount = getSwapCount();
  let attemptCount = 0;
  while (swapCount) {
    attemptCount++;
    const sourceIndex = Math.floor(Math.random() * evolved.keys.length);
    const targetIndex = Math.floor(Math.random() * evolved.keys.length);
    const valid = [
      checkNoOps,
      checkDuplicates,
      checkMaskedKeys,
    ].every(validator => validator(evolved, seen, sourceIndex, targetIndex));
    if (valid) {
      swapKeys(evolved, sourceIndex, targetIndex);
      swapCount--;
    } else if (attemptCount > 1000) {
      log(`Likely deadlock in evolve() (bailing)`);
      return null;
    }
  }

  seen[getLayoutDigest(evolved)] = true;
  return evolved;
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

function getRandomLayout(): Layout {
  let layout = LAYOUTS.QWERTY;
  console.log('Creating random layout...');
  const seen = {[getLayoutDigest(layout)]: true};
  for (let i = 0; i < 1000; i++) {
    layout = evolve(layout, seen);
  }
  return layout;
}

(async function() {
  const json = require('../package');

  function common(yargsish) {
    return yargsish
      .help('h')
      .alias('h', 'help')
      .version(json.version)
      .epilog(json.homepage)
      .strict()
      .argv;
  }

  let argv = common(yargs
    .usage('Usage: $0 <command> [options...]')
    .command('corpus-stats', 'show corpus stats', yargs => {
      argv = common(
        yargs
          .reset()
          .usage('Usage: $0 corpus-stats')
      );
    })
    .command('help', 'Show help')
    .command('layout-stats', 'show layout stats', yargs => {
      argv = common(
        yargs
          .reset()
          .usage('Usage: $0 layout-stats [layout]')
      );
    })
    .command('optimize', 'produce optimized keyboard layout', yargs => {
      argv = common(
        yargs
          .reset()
          .usage('Usage: $0 optimize [layout]')
          .default('iteration-count', 10000)
          .alias('c', 'iteration-count')
      );
    })
    .demand(1, 'must provide a valid command')
  );

  async function getCorpus(): string {
    const corpusPath = path.join('yak', 'corpus.txt');
    const corpus = await readFile(corpusPath);
    return corpus.toString().trim().toLowerCase();
  }

  const command = argv._[0];

  if (command === 'corpus-stats') {
    printCorpusStats(await getCorpus());
  } else if (command === 'layout-stats') {
    const corpus = await getCorpus();
    const layout = (argv._[1] || 'QWERTY').toUpperCase();
    if (!(layout in LAYOUTS)) {
      throw new Error(`Unknown layout: ${layout}`);
    }
    printLayoutStats(LAYOUTS[layout], corpus);
  } else if (command === 'optimize') {
    const corpus = await getCorpus();
    const {nGrams: trigrams} = getNGramFrequencies(corpus, 3);
    const sortedTrigrams = getSortedNGrams(trigrams);
    let layout;
    if (argv._[1]) {
      layout = argv._[1].toUpperCase();
      if (!(layout in LAYOUTS)) {
        throw new Error(`Unknown layout: ${layout}`);
      }
      layout = LAYOUTS[layout];
    } else {
      layout = getRandomLayout();
    }
    optimize(layout, sortedTrigrams, argv.iterationCount);
  } else {
    yargs.showHelp();
  }
})();
