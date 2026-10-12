/* GAME HUB service worker — cache-first so the hub works offline once visited */
const CACHE = 'gamehub-v24';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './themes/themes.css',
  './themes/themes.js',
  './lang/lang.js',
  './lang/help.js',
  './backgrounds/wallpaper.png',
  './games/accordion.html',
  './games/aimtrainer.html',
  './games/avoider.html',
  './games/bingo.html',
  './games/chimptest.html',
  './games/colormatch.html',
  './games/craps.html',
  './games/dominosa.html',
  './games/hidato.html',
  './games/highlow.html',
  './games/keno.html',
  './games/liarsdice.html',
  './games/magicsquare.html',
  './games/mexico.html',
  './games/numbermemory.html',
  './games/quickmath.html',
  './games/reaction.html',
  './games/roulette.html',
  './games/rps.html',
  './games/sequencememory.html',
  './games/shikaku.html',
  './games/skyscrapers.html',
  './games/slots.html',
  './games/tapatan.html',
  './games/typingtest.html',
  './games/visualmemory.html',
  './games/anagram.html',
  './games/breakthrough.html',
  './games/catch.html',
  './games/clobber.html',
  './games/clocksolitaire.html',
  './games/cryptogram.html',
  './games/dino.html',
  './games/futoshiki.html',
  './games/helicopter.html',
  './games/hitori.html',
  './games/kenken.html',
  './games/konane.html',
  './games/mutorere.html',
  './games/orderchaos.html',
  './games/pente.html',
  './games/pig.html',
  './games/shared.css',
  './games/2048.html',
  './games/asteroids.html',
  './games/battleship.html',
  './games/binairo.html',
  './games/blackjack.html',
  './games/breakout.html',
  './games/bubbleshooter.html',
  './games/centipede.html',
  './games/checkers.html',
  './games/chess.html',
  './games/chinesecheckers.html',
  './games/columns.html',
  './games/connect3.html',
  './games/connect4.html',
  './games/crazyeights.html',
  './games/dominoes.html',
  './games/doodlejump.html',
  './games/dotsboxes.html',
  './games/farkle.html',
  './games/flappy.html',
  './games/floodit.html',
  './games/flow.html',
  './games/freecell.html',
  './games/frogger.html',
  './games/gofish.html',
  './games/golf.html',
  './games/gomoku.html',
  './games/hangman.html',
  './games/hanoi.html',
  './games/hearts.html',
  './games/hex.html',
  './games/invaders.html',
  './games/klotski.html',
  './games/lander.html',
  './games/lightsout.html',
  './games/mahjong.html',
  './games/mancala.html',
  './games/mastermind.html',
  './games/match3.html',
  './games/maze.html',
  './games/memory.html',
  './games/minesweeper.html',
  './games/missilecommand.html',
  './games/ninemensmorris.html',
  './games/nim.html',
  './games/nonogram.html',
  './games/oldmaid.html',
  './games/pacman.html',
  './games/pegsolitaire.html',
  './games/pipes.html',
  './games/pong.html',
  './games/pyramid.html',
  './games/reversi.html',
  './games/rushhour.html',
  './games/sevens.html',
  './games/shipcaptaincrew.html',
  './games/simon.html',
  './games/skipbo.html',
  './games/slidepuzzle.html',
  './games/snake.html',
  './games/snakesladders.html',
  './games/sokoban.html',
  './games/solitaire.html',
  './games/spaceshooter.html',
  './games/spider.html',
  './games/stacker.html',
  './games/sudoku.html',
  './games/tank.html',
  './games/tetris.html',
  './games/threes.html',
  './games/tripeaks.html',
  './games/tron.html',
  './games/ultimatettt.html',
  './games/uno.html',
  './games/videopoker.html',
  './games/war.html',
  './games/watersort.html',
  './games/whackamole.html',
  './games/wordguess.html',
  './games/wordladder.html',
  './games/wordsearch.html',
  './games/yatzy.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // never intercept server heartbeat/control endpoints
  if (url.pathname.startsWith('/__')) return;

  const isPage = url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  const cacheIt = res => {
    if (res.ok && url.origin === location.origin) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
    }
    return res;
  };

  if (isPage) {
    // network-first for pages: always play the latest version, cache only as offline fallback
    e.respondWith(
      fetch(e.request).then(cacheIt).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  } else {
    // cache-first for assets (css/js/images)
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(cacheIt))
    );
  }
});
