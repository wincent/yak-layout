#!/bin/sh
# Copyright 2015-present Greg Hurrell. All rights reserved.
# Licensed under the terms of the MIT license.

set -e

cd ~/code

dump() {
  cd $1
  # Strip "Signed-off-by:" (etc) lines; they're not interesting because they are
  # machine-generated.
  git log --pretty=format:%B | sed -E '/(Change-Id|Reviewed-on|Reviewed-by|Signed-off-by|Tested-by):/d'
  cd -
}

dump WOPublic
dump ansible-configs
dump buildtools
dump clipper
dump codegen/src
dump command-t
dump corpus
dump docvim
dump ferret
dump git-cipher
dump loupe
dump mkdtemp/src
dump prefnerd
dump puppet-configs
dump simple-debounce
dump sudoku
dump terminus
dump twigg
dump vim-clipper
dump walrat/src
dump walrus/src
dump wikitext/src
dump wincent
dump wincent.com/src

find \
  corpus/src \
  ferret \
  flux/src \
  jest/src \
  jscodeshift/src \
  loupe \
  react/src \
  relay \
  terminus \
  wincent.com/src/app \
  -name '*.txt' \
  -o -name '*.js' \
  -o -name '*.rb' \
  -o -name '*.md' | xargs cat
