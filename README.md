# 🎮 GAME HUB

A collection of **124 classic games** in one offline, zero-dependency app. No frameworks,
no build step for the games, no internet required — every game is a single self-contained
HTML file that runs straight from the folder.

![games](https://img.shields.io/badge/games-124-f0c040) ![deps](https://img.shields.io/badge/dependencies-0-40c0a0) ![license](https://img.shields.io/badge/license-MIT-5090e0)

## ▶ Run it

- **Windows:** double-click **`GameHub.exe`** (one file, no Python needed). It starts a
  tiny local server and opens the hub in an app window, then closes itself when you close
  the window.
- **No exe / other OS:** double-click **`Start GameHub.bat`**, or serve the folder with any
  static web server, e.g.

  ```bash
  python -m http.server 8123
  ```

  then open `http://localhost:8123/index.html`.

It also installs as a **PWA** (offline-capable) from a browser via the “Install as app” button.

## 🕹️ The games

**🃏 Card (18):** Solitaire · Spider · FreeCell · Hearts · Blackjack · Skip-Bo · Uno · War ·
Crazy Eights · Go Fish · Video Poker · Pyramid · TriPeaks · Golf · Old Maid · Clock Solitaire ·
Sevens · Accordion

**♟️ Board (23):** Chess · Checkers · Reversi · 4 in a Row · Noughts & Crosses · Gomoku ·
Battleship · Dots & Boxes · Mancala · Nim · Snakes & Ladders · Nine Men's Morris · Dominoes ·
Chinese Checkers · Ultimate Tic-Tac-Toe · Hex · Pente · Order & Chaos · Mū Tōrere · Breakthrough ·
Kōnane · Clobber · Tapatan

**🕹️ Arcade (30):** Snake · Tetris · Breakout · Pong · Flappy · Whack-a-Mole · Simon · Tron ·
Doodle Jump · Space Invaders · Asteroids · Frogger · Lunar Lander · Pac-Man · Bubble Shooter ·
Missile Command · Centipede · Columns · Dino Run · Helicopter · Catch · Stacker · Space Shooter ·
Tank · Avoider · Aim Trainer · Reaction Time · Typing Test · Quick Math · Color Match

**🧩 Puzzle & Brain (40):** Sudoku · Minesweeper · 2048 · Mahjong · Memory · Slide Puzzle ·
Lights Out · Flood It · Tower of Hanoi · Mastermind · Maze · Water Sort · Hangman · Word Search ·
Sokoban · Nonogram · Peg Solitaire · Klotski · Gem Match · Rush Hour · Pipes · Flow · Binairo ·
Hitori · Futoshiki · Threes · Word Guess · Anagram · Cryptogram · KenKen · Word Ladder · Hidato ·
Shikaku · Skyscrapers · Magic Square · Dominosa · Number Memory · Visual Memory · Sequence Memory ·
Chimp Test

**🎰 Casino & Luck (13):** Yatzy · Farkle · Pig · Ship Captain Crew · Mexico · Liar's Dice ·
Craps · Rock Paper Scissors · Higher or Lower · Slot Machine · Roulette · Keno · Bingo

Most games offer difficulty / size options and a vs-AI or 2-player mode where it makes sense.

## ✨ Features

- **How to Play** — every game has an ℹ️ panel with its rules and controls, and it pops up
  automatically the first time you open a game.
- **Juice** — every card game deals its cards in and flips them over (Blackjack's hole card,
  War's duel, the solitaires and more); played cards slide to the pile (Crazy Eights, Uno, Hearts,
  Sevens, Skip-Bo — your moves and the AI's); casino games toss chips when you bet and win;
  confetti bursts on a win, a pop-in win screen, and snappy button
  press feedback (all disabled automatically if you prefer reduced motion).
- **Themes** — 6 built-in themes (Classic Dark, Casino Felt, Wood Table, Neon Arcade,
  Midnight, My Wallpaper) with subtle textures, switchable from the 🎨 button on any page.
- **Sound** — a richer Web Audio engine (warm tones, card/dice/chip/shuffle effects and
  win jingles) with a 🔊 mute toggle (saved per browser).
- **Card art** — crisp playing-card faces with inset frames, corner pips and ornate backs.
- **High scores** — best scores, times and win counts are saved locally per game.
- **Responsive** — works on desktop and touch (phones/tablets) with on-screen controls,
  verified to fit without horizontal scrolling down to a 375px phone screen.
- **Offline-first** — a service worker caches everything after the first visit.

## 🗂️ Project layout

```
GameHub.exe        one-click launcher (built from launcher.py)
build_exe.bat      rebuild GameHub.exe (needs: pip install pyinstaller)
launcher.py        server + opens the app window (PyInstaller entry point)
index.html         the hub
games/             one HTML file per game + shared.css
themes/            theme engine (themes.css / themes.js) + sound & score engine
lang/              language strings
backgrounds/       wallpaper for the "My Wallpaper" theme
icons/             PWA icons + gamehub.ico
server.py          local server (Python)
server.ps1         local server (PowerShell fallback)
sw.js              service worker (offline cache)
```

## 🔨 Building the exe

```bash
pip install pyinstaller
build_exe.bat
```

The exe serves the game files next to it, so you can keep editing or adding games without
rebuilding; it also bundles a copy so it still runs on its own. After editing any game or
shared file, bump the `CACHE` version in `sw.js` so returning players get the update.

## 📄 License

[MIT](LICENSE) © Farathim
