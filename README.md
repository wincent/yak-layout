# The "Yak" keyboard layout and optimizer

Yak is a tool for developing keyboard layouts via a genetic algorithm. The
layouts are optimized for programming and typing English text.

Yak will also be the name for the layout produced by the tool. At this time I
haven't declared a definitive, final version, but it could end up looking
something like the following (this is a sample produced by 10,000 iterations
of optimization, using the Colemak layout as a starting point):

```
⎋  F1  F2  F3  F4  F5  F6  F7  F8  F9  F10  F11  F12  ⌽
`  1  2  3  4  5  6  7  8  9  0  -  =  ⌫
⇥  d  c  m  p  b  j  x  v  y  ;  [  ]  \
⇪  a  r  t  i  h  g  s  n  e  o  '  ↩
⇧  u  l  w  f  z  k  q  ,  .  /  ⇧
fn ⌃  ⌥  ⌘  ␣  ⌘  ⌥  ←  ↑  ↓  →
```

## Design guidelines

- Learning a new layout is hard: so hard, that you probably only want to do it
  once in your life. Therefore, the design should go "all in" and feel free to
  move all and any keys from their Qwerty positions.
- Inward rolls are delightful and should be prioritized.
- Both the training corpus and the genetic algorithm should be highly
  personalized; for example, the finger-to-key placement model should be based
  on what the user actually does in practice and not what they _should_ do if
  they follow idealzed typing recommendations (for example, I pretty much avoid
  using pinkie fingers for anything, so the model should reflect that reality).
- The genetic algorithm should take cues from Martin Krzywinski's excellent work
  on the [carpalx project](http://mkweb.bcgsc.ca/carpalx/?colemak), but it
  should feature a multi-factor fitness model that goes beyond carpalx's three
  factors (base, penalty and stroke path).

## Why a new keyboard layout?

### Short version

From the "Standard Justification For a Project's Existence" playbook:

> ... I realized I needed [blah, blah, blah] but when I surveyed the already
> existing projects I found that [blah, blah, blah], when what I really needed
> was [blah blah blah]. So, this project was born...

### Longer version

I've been aware of alternative keyboard layouts for a long time — years — and as
a relentless optimizer, I've been strongly tempted to make the switch to one.
But I'm also a Vim user, and the problematic location of the `h`, `j`, `k`, `l`
keys made me doubt. None of the major alternative layouts had these keys in
locations that maintained their spatial relationships in a reasonable way, and I
didn't want to go down the rabbit hole of remapping Vim's core functionality (I
very much prefer to keep things vanilla in that respect).

This was enough to deter me, literally for years.

Fast forward to 2015 and I'm on parental leave so have a little bit of time in
which I can take the speed hit of learning a new layout. I did a bunch of
searching and revisited the major layouts (in my mind,
[Dvorak](https://en.wikipedia.org/wiki/Dvorak_Simplified_Keyboard),
[Colemak](http://colemak.com/), [Workman](http://colemakmods.github.io/mod-dh/),
[Norman](https://normanlayout.info/)) as well as some of the more obscure
options ([Arnesito](http://www.pvv.org/~hakonhal/main.cgi/keyboard) probably
being the most radical) and variants on the more common layouts (such as
[Colemak Mod_DH](http://colemakmods.github.io/mod-dh/)). None of these address
my concerns with `h`, `j`, `k`, `l`.

I was aware of the fantastic [carpalx](http://mkweb.bcgsc.ca/carpalx/) tool,
which is highly parameterizable, and which I thought I might be able to use to
generate a much-better-than-Qwerty layout without changing the position of `h`,
`j`, `k`, `l` (or at least, changing them to some other places where the spatial
relationships were maintained).

Alas, I found it wasn't quite flexible enough to do exactly what I wanted. I
could use the "mask" functionality, for example, to pin a key in place, but I
couldn't specify more sophisticated constraints such as "put these two keys next
to each other but I don't care where", and so on.

I looked at Micheal Dicken's [genetic layout
optimizer](https://github.com/michaeldickens/Typing) which produced the so
called "MTGAP" layouts, and I read his accompanying [blog
posts](https://mathematicalmulticore.wordpress.com/category/keyboards/) ([this
intro
piece](https://mathematicalmulticore.wordpress.com/2009/08/07/optimized-evolutionary-algorithm-for-keyboard-design-part-1/)
is a good example). I also dived into the [Colemak
forums](http://forum.colemak.com/) and read about [other people's
attempts](http://forum.colemak.com/viewtopic.php?id=397) at making keyboards
using genetic algorithms. It's a fascinating field of study.

The problem space here is really large. There are too many possible keyboard
layouts to make testing them all feasible, and defining what makes one layout
better than another is a highly subjective matter. These tools all have
different takes on how to establish the "fitness" of a given layout. The main
strategies are some blend of the following heuristics:

- Strokes with weaker fingers are penalized.
- Keys farther away from the base home row positions are penalized.
- Hand alternation may (or may not) be preferred.
- "Rolls" are considered good things (towards the inside; less so or not at all
  towards the outside).
- Finger movement distance should be minimized; especially same-finger movement.
- The most common digrams and trigrams (two-letter and three-letter sequences)
  should be very easy to type, to the extent that entire layouts exist to make
  typing "th" or similar easier.
- Some layouts try to keep important shortcut keys (eg. "C" for copy, "V" for
  paste etc) in their Qwerty positions.
- Others may avoid moving Qwerty keys between fingers or hands.
- Some maintain punctuation in Qwerty positions; others swap the shifted and
  unshifted values of the number keys to make punctuation more accessible;
  others still mix punctuation in among the main "block" of letter keys.

Which of these heuristics should be weighed more heavily is open to debate.
Unfortunately, the cost of experimentation is high, as one cannot simply learn a
new layout every week (for example, to learn a high-alternation layout like
Dvorak one week, a distance-minimizing layout like Arnesito the next week, and a
balanced layout like Colemak the following week). This means much of this is
more art than science, as you end up having to go with your gut instinct.

Like any programmer faced with an excessive amount of choice, I decided it was
time to write my own tool, one capable of perfectly expressing my intent. If I
was going to go through the pain of learning a new layout, I wanted to do it
only once in my lifetime, using an optimal algorithm tailored to my needs, and
drawing on a corpus of my own typing.

By this point I'd realized two things:

- Doing this _properly_ was going to be a lot of work: not only would I have to
  develop the algorithm, but I'd need to get a high-quality corpus, and that
  could be very time-consuming indeed. For example, it wasn't going to be enough
  to just pipe source code into the corpus. Source code is heavily edited and
  re-edited, and shortcuts, autocomplete and snippets are used to produce large
  amounts of text without actually typing it. Furthermore, in Vim, a lot of
  typing occurs outside of "insert" mode but doesn't wind up reflected in the
  document. In short, the only way to get an authoritative corpus would
  effectively be to keylog (capturing keystroke and timing information) for an
  extended period, which would not be without its technical difficulties, and
  would also burn through the window of opportunity that I had during parental
  leave to learn a new layout.
- The difference between the popular alternative layouts is small, and choosing
  a "best" layout is hard and of dubious advantage; simply switching away from
  Qwerty towards any other layout would probably be a winning move.

In my gut, I sensed that Colemak would be good enough, and it comes on OS X by
default, so no messing with layout files or other complicated set-up would be
required in order to use it. Additionally, even though the `h`, `j`, `k`, `l`
keys don't have the desired spatial configuration, they _are_ at least close to
one another, and I have the option of using a tool like
[Karabiner](https://pqrs.org/osx/karabiner/) to end-run around the problem and
define an alternate layer that brings the cursor keys onto the home row whenever
I hit dead key or hold down Alt.

So, I decided to switch to Colemak, build the layout optimizer for fun, and
throw a good-but-not-perfect corpus at it (ie. I was going to skip the
keylogging step). This was still going to be a non-trivial side-project, with
multiple steps involved. In short yak-shaving. Some layouts have names (like
QGMLWB) are hard to remember and even hard to pronounce. Given the amount of
yak-shaving involved in my plan, "Yak" seemed like a good name for the layout.

## Install

```sh
$ npm install -g yak-layout
```

## Usage

```sh
$ yak help # show usage info
$ yak corpus-stats # show corpus statistics
$ yak layout-stats [layout] # show layout statistics (defaults to QWERTY)
$ yak optimize [layout] # generate an optimal layout
```

### Sample output

- [yak optimize](https://gist.github.com/wincent/71731c1ba9afaf9f0b35)
- [yak corpus-stats](https://gist.github.com/wincent/59d46104c20442f9ae2b)
- [yak layout-stats](https://gist.github.com/wincent/1fc73024b61b19263252)

## Known issues

- You have to B.Y.O.C. (Bring Your Own Corpus) and store in in
  `./yak/corpus.txt` (although the repo contains a dead-simple script in the
  "extras" directory that I used to throw together a quick-and-dirty corpus).
- We don't yet model alternate layers (for example, the "Alt" layer).
- We treat shifted versions of keys as wedded to their unshifted keys, always
  moving them together.
- Not yet implemented: more sophisticated constraints such as "move numbers but
  keep them in this row".
- Configurability is limited from the command-line; many things can only be
  tweaked by editing data structures in the source code.
- There is no built-in facility for running the `optimize` subcommand
  repeatedly, accumulating the serialized, optimized layouts onto disk for later
  processing; there's not built-in facility for analyzing such batches of
  optimized layouts either.


## Links

- Source: [github.com/wincent/yak-layout](https://github.com/wincent/yak-layout)
- Package:
  [www.npmjs.com/package/yak-layout](https://www.npmjs.com/package/yak-layout)

## License

### The MIT License (MIT)

Copyright (c) 2015-present Greg Hurrell

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
