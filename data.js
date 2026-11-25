/* Sink or Float — the toys and every spoken line.
   Plain data only (the service worker also reads this file to know which voice clips to cache). */
'use strict';

/* floats: true  -> sub = how much of it sits under the water when it floats (0..1)
   floats: false -> vt = how fast it sinks (toy sizes per second); tumble / flutter = how it wobbles on the way down
   size = its biggest side, in "toy units" (one toy unit is set from the screen size) */
var TOYS = [
  { id: 'duck',   name: 'Rubber duck',  floats: true,  sub: 0.34, size: 1.15,
    intro: 'Here is a rubber duck!',  why: 'It floats! The rubber duck is full of air.' },
  { id: 'leaf',   name: 'Leaf',         floats: true,  sub: 0.30, size: 1.10,
    intro: 'Here is a leaf!',         why: 'It floats! The leaf is light and flat.' },
  { id: 'apple',  name: 'Apple',        floats: true,  sub: 0.78, size: 0.95,
    intro: 'Here is an apple!',       why: 'It floats! Apples have tiny bits of air inside.' },
  { id: 'block',  name: 'Wooden block', floats: true,  sub: 0.55, size: 0.95,
    intro: 'Here is a wooden block!', why: 'It floats! Wood floats on water.' },
  { id: 'ball',   name: 'Beach ball',   floats: true,  sub: 0.16, size: 1.20,
    intro: 'Here is a beach ball!',   why: 'It floats! The ball is full of air.' },
  { id: 'ice',    name: 'Ice cube',     floats: true,  sub: 0.80, size: 0.80,
    intro: 'Here is an ice cube!',    why: 'It floats! Ice floats on water.' },
  { id: 'sponge', name: 'Sponge',       floats: true,  sub: 0.42, size: 1.05,
    intro: 'Here is a sponge!',       why: 'It floats! The sponge has lots of tiny air holes.' },
  { id: 'boat',   name: 'Sailboat',     floats: true,  sub: 0.26, size: 1.25,
    intro: 'Here is a sailboat!',     why: 'It floats! Boats are made to float.' },

  { id: 'rock',   name: 'Rock',         floats: false, vt: 1.5, size: 0.95,
    intro: 'Here is a rock!',         why: 'It sinks! Rocks are hard and heavy.' },
  { id: 'key',    name: 'Key',          floats: false, vt: 1.3, size: 1.00, tumble: 0.5,
    intro: 'Here is a key!',          why: 'It sinks! Keys are made of metal.' },
  { id: 'coin',   name: 'Coin',         floats: false, vt: 0.9, size: 0.62, flutter: 0.45,
    intro: 'Here is a coin!',         why: 'It sinks! Even a tiny coin can sink.' },
  { id: 'spoon',  name: 'Spoon',        floats: false, vt: 1.2, size: 1.15, tumble: 0.35,
    intro: 'Here is a spoon!',        why: 'It sinks! The metal spoon is heavy.' },
  { id: 'marble', name: 'Marble',       floats: false, vt: 1.7, size: 0.55,
    intro: 'Here is a marble!',       why: 'It sinks! The marble is small, but heavy.' },
  { id: 'car',    name: 'Toy car',      floats: false, vt: 1.4, size: 1.10,
    intro: 'Here is a toy car!',      why: 'It sinks! The car is made of metal.' },
  { id: 'egg',    name: 'Egg',          floats: false, vt: 0.8, size: 0.75, tumble: 0.25,
    intro: 'Here is an egg!',         why: 'It sinks! An egg sinks to the bottom.' },
  { id: 'shell',  name: 'Seashell',     floats: false, vt: 1.0, size: 0.90, flutter: 0.3,
    intro: 'Here is a seashell!',     why: 'It sinks! Shells are hard and heavy, like rocks.' },
];

/* everything Fizz the frog says. key = voice clip name (voice/<key>.mp3) */
var TEXT = {
  title:        "Will it sink, or float? Let's play!",
  ribbit:       "Ribbit! Let's play!",
  hello:        "Hi! I'm Fizz the frog!",
  lets_find:    "Let's find out what floats, and what sinks!",
  pick:         'Pick a toy to test!',
  ask:          'Will it float, or sink?',
  guess_float:  'You think it will float!',
  guess_sink:   'You think it will sink!',
  drop:         'Now drop it in the water!',
  guess_first:  'First, tap float or sink!',
  right1:       'You guessed right!',
  right2:       'Yes! You were right!',
  right3:       'Right again! Great thinking!',
  surprise1:    'Oh! What a surprise!',
  surprise2:    'Wow, a surprise! Now we know!',
  pick_another: 'Pick another toy to test!',
  all_done:     'Every toy is tested! You are a super scientist!',
  free_intro:   'Drop the toys in the water, and watch what happens!',
  floats:       'It floats on top!',
  sinks:        'It sinks to the bottom!',
  popup:        'Pop! It floats back up!',
  these_float:  'These toys float!',
  these_sink:   'These toys sink!',
  sound_on:     'Sound on!',
  new_toys:     'Here are some new toys to try!',
  all_clean:    'All clean!',
  start_again:  "Let's start again!",
};
TOYS.forEach(function (t) {
  TEXT[t.id + '_intro'] = t.intro;
  TEXT[t.id + '_why'] = t.why;
});
