/* ============================================================
   GAME HUB — LANGUAGE ENGINE  (English / Svenska)
   Injects a 🌐 button (bottom-left) on every page and translates
   the UI live via dictionary + MutationObserver.
   Include with:  <script src="../lang/lang.js" defer></script>
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'gamehub.lang';

  function cur() { try { return localStorage.getItem(KEY) || 'en'; } catch (e) { return 'en'; } }
  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }

  /* ─── EN → SV dictionary (exact match on trimmed text) ─── */
  var D = {
    // hub
    'CHOOSE YOUR GAME':'VÄLJ DITT SPEL','⬇ INSTALL AS APP':'⬇ INSTALLERA SOM APP',
    '🃏 CARD GAMES':'🃏 KORTSPEL','♟️ BOARD GAMES':'♟️ BRÄDSPEL','🧩 PUZZLE & ARCADE':'🧩 PUSSEL & ARKAD',
    'SOLITAIRE':'PATIENS','SPIDER':'SPINDELN','HEARTS':'HJÄRTER','CHESS':'SCHACK','CHECKERS':'DAMSPEL',
    '4 IN A ROW':'4 I RAD','NOUGHTS & ✕':'TRE I RAD','MINESWEEPER':'MINRÖJ','SNAKE':'ORMEN',
    'Classic Klondike — Draw 1 or 3':'Klassisk Klondike — dra 1 eller 3',
    'Spider Solitaire — 1/2/4 suits':'Spindelpatiens — 1/2/4 färger',
    '8 cascades, 4 free cells':'8 kaskader, 4 fria celler',
    'Avoid hearts & the Q♠ — vs 3 AI':'Undvik hjärter & Q♠ — mot 3 AI',
    'Beat the dealer to 21':'Slå given till 21',
    'Race to clear your stockpile':'Töm din hög först',
    'Match colors & use action cards':'Matcha färger & spela aktionskort',
    'vs AI or 2 Players — with guide mode':'Mot AI eller 2 spelare — med guide',
    'Forced captures & kings — vs AI':'Tvingade slag & damer — mot AI',
    'Othello — vs AI or 2 Players':'Othello — mot AI eller 2 spelare',
    'Drop discs — connect 4 to win':'Släpp brickor — 4 i rad vinner',
    'Tic-Tac-Toe — 3×3 to 7×7 boards':'Luffarschack — 3×3 till 7×7',
    '4×4 up to 25×25 with notes & hints':'4×4 till 25×25 med noteringar & tips',
    'Classic mines — flags & chords':'Klassisk minröj — flaggor & ackord',
    "Eat, grow, don't crash":'Ät, väx, krascha inte',
    'Join tiles to reach 2048':'Slå ihop brickor till 2048',
    'Tile-matching solitaire — turtle':'Matcha brickor — sköldpaddan',
    'Flip pairs — vs AI or 2 Players':'Vänd par — mot AI eller 2 spelare',
    'Classic & Maxi — 5 or 6 dice':'Klassisk & Maxi — 5 eller 6 tärningar',
    // game titles (headers)
    '♦️ SOLITAIRE':'♦️ PATIENS','🕷️ SPIDER':'🕷️ SPINDELN','💔 HEARTS':'💔 HJÄRTER','♟️ CHESS':'♟️ SCHACK',
    '🔴 CHECKERS':'🔴 DAMSPEL','🟡 4 IN A ROW':'🟡 4 I RAD','✕ NOUGHTS & CROSSES':'✕ TRE I RAD',
    '💣 MINESWEEPER':'💣 MINRÖJ','🐍 SNAKE':'🐍 ORMEN','NOUGHTS & CROSSES':'TRE I RAD',
    // common buttons & pills
    'NEW GAME':'NYTT SPEL','PLAY AGAIN':'SPELA IGEN','CHANGE MODE':'BYT LÄGE','← HUB':'← MENY',
    '↩ UNDO':'↩ ÅNGRA','💡 HINT':'💡 TIPS','🔀 SHUFFLE':'🔀 BLANDA','AUTO ✓':'AUTO ✓',
    '⏸ PAUSE':'⏸ PAUS','▶ RESUME':'▶ FORTSÄTT','✕ ERASE':'✕ SUDDA','📝 NOTES':'📝 NOTERA','📝 ON':'📝 PÅ',
    '📖 GUIDE':'📖 GUIDE','DEAL':'GE','▶ GENERATE':'▶ SKAPA','RESET BANK':'NOLLSTÄLL BANK','CLEAR':'RENSA',
    'HIT':'KORT','STAND':'STANNA','DOUBLE':'DUBBLA','▶ DEAL':'▶ GE','KEEP GOING':'FORTSÄTT',
    '🎲 ROLL DICE':'🎲 KASTA','🎲 ROLL AGAIN':'🎲 KASTA IGEN','🔒 LOCK ALL':'🔒 LÅS ALLA',
    'PASS 3 CARDS ▶':'SKICKA 3 KORT ▶','END TURN →':'AVSLUTA TUR →','DRAW CARD':'DRA KORT',
    '▶ PLAY THIS CARD':'▶ SPELA KORTET','🔀 SHUFFLE REST':'🔀 BLANDA RESTEN','NEW PUZZLE':'NYTT PUSSEL',
    // modes
    '2 PLAYERS':'2 SPELARE','👥 2 PLAYERS':'👥 2 SPELARE','VS AI':'MOT AI','🤖 VS AI':'🤖 MOT AI',
    'VS AI (Easy)':'MOT AI (Lätt)','VS AI (Hard)':'MOT AI (Svår)',
    '🤖 VS AI (Easy)':'🤖 MOT AI (Lätt)','🤖 VS AI (Hard)':'🤖 MOT AI (Svår)',
    '🤖 AI (Easy)':'🤖 AI (Lätt)','🤖 AI (Hard)':'🤖 AI (Svår)','🧠 SOLO':'🧠 SOLO','SOLO':'SOLO',
    '2 PLAYERS':'2 SPELARE','EASY (Draw 1)':'LÄTT (Dra 1)','MEDIUM (Draw 1)':'MEDEL (Dra 1)','HARD (Draw 3)':'SVÅR (Dra 3)',
    '1 SUIT — Easy':'1 FÄRG — Lätt','2 SUITS — Medium':'2 FÄRGER — Medel','4 SUITS — Hard':'4 FÄRGER — Svår',
    'EASY 9×9 · 10💣':'LÄTT 9×9 · 10💣','MEDIUM 16×16 · 40💣':'MEDEL 16×16 · 40💣','HARD 24×16 · 70💣':'SVÅR 24×16 · 70💣',
    'SLOW':'LÅNGSAM','NORMAL':'NORMAL','FAST':'SNABB','INSANE':'GALEN',
    '4×4 (Easy)':'4×4 (Lätt)','5×4 (Medium)':'5×4 (Medel)','6×6 (Hard)':'6×6 (Svår)',
    'EASY':'LÄTT','MEDIUM':'MEDEL','HARD':'SVÅR','EXPERT':'EXPERT','SIZE':'STORLEK','DIFFICULTY':'SVÅRIGHET',
    '🎲 CLASSIC — 5 DICE':'🎲 KLASSISK — 5 TÄRNINGAR','🎰 MAXI — 6 DICE':'🎰 MAXI — 6 TÄRNINGAR',
    // stats / labels
    'SCORE:':'POÄNG:','MOVES:':'DRAG:','TIME:':'TID:','BEST:':'REKORD:','DECK:':'KORTLEK:','HINTS:':'TIPS:',
    'ERRORS:':'FEL:','PAIRS:':'PAR:','TILES:':'BRICKOR:','PAIRS FREE:':'FRIA PAR:','ROUND:':'RUNDA:','BET:':'INSATS:',
    'CAPTURED BY BLACK':'SLAGNA AV SVART','CAPTURED BY WHITE':'SLAGNA AV VIT',
    'DEALER':'GIVEN','YOU':'DU','UPPER SECTION':'ÖVRE DELEN','LOWER SECTION':'NEDRE DELEN',
    'CATEGORY':'KATEGORI','Upper Total':'Övre summa','TOTAL SCORE':'TOTALPOÄNG','Bonus (+35)':'Bonus (+35)','Bonus (+100)':'Bonus (+100)',
    'STOCKPILE':'HÖGEN','BUILD PILES — click to play selected card':'BYGGHÖGAR — klicka för att spela valt kort',
    'YOUR DISCARD PILES':'DINA SLÄNGHÖGAR','DISCARD PILES':'SLÄNGHÖGAR','FREE CELLS ← → FOUNDATIONS · CLICK CARD THEN DESTINATION · DOUBLE-CLICK = TO FOUNDATION':'FRIA CELLER ← → GRUNDHÖGAR · KLICKA KORT SEDAN MÅL · DUBBELKLICK = TILL GRUNDHÖG',
    '🤖 NORTH':'🤖 NORR','🤖 EAST':'🤖 ÖST','🤖 WEST':'🤖 VÄST',
    'BACKGROUND':'BAKGRUND','NONE':'INGEN','📂 IMAGE':'📂 BILD','✕ CLEAR':'✕ RENSA',
    '🎨 SELECT THEME':'🎨 VÄLJ TEMA','CLASSIC DARK':'KLASSISK MÖRK','CASINO FELT':'KASINOFILT','WOOD TABLE':'TRÄBORD',
    'NEON ARCADE':'NEON ARKAD','MIDNIGHT':'MIDNATT','MY WALLPAPER':'MIN BAKGRUND',
    // turn / win text
    '🎲 ROLL TO START':'🎲 KASTA FÖR ATT BÖRJA','GAME OVER':'SPELET SLUT','💀 GAME OVER':'💀 SPELET SLUT',
    '🏆 GAME OVER!':'🏆 SPELET SLUT!','🏆 YOU WIN!':'🏆 DU VANN!','🤖 AI WINS!':'🤖 AI VANN!',
    '🏆 PLAYER 1 WINS!':'🏆 SPELARE 1 VANN!','🏆 PLAYER 2 WINS!':'🏆 SPELARE 2 VANN!',
    '🟡 PLAYER 1 WINS!':'🟡 SPELARE 1 VANN!','🔴 PLAYER 2 WINS!':'🔴 SPELARE 2 VANN!',
    '🤝 TIE!':'🤝 LIKA!','🤝 TIE GAME!':'🤝 LIKA!','🤝 DRAW!':'🤝 OAVGJORT!','🤝 IT\'S A DRAW!':'🤝 OAVGJORT!',
    '🤝 STALEMATE!':'🤝 PATT!','⚠️ CHECK!':'⚠️ SCHACK!','⬜ WHITE WINS!':'⬜ VIT VANN!','⬛ BLACK WINS!':'⬛ SVART VANN!',
    '⚫ BLACK WINS!':'⚫ SVART VANN!','⚪ WHITE WINS!':'⚪ VIT VANN!','🔴 RED WINS!':'🔴 RÖD VANN!','⚫ BLACK WINS!':'⚫ SVART VANN!',
    '💥 BOOM!':'💥 PANG!','🏆 CLEARED!':'🏆 KLARAT!','🀄 CLEARED!':'🀄 KLARAT!','🏆 SOLVED!':'🏆 LÖST!',
    '🕷️ SPIDER CLEARED!':'🕷️ SPINDELN KLARAD!','🧠 COMPLETE!':'🧠 KLART!','🧱 NO MOVES LEFT':'🧱 INGA DRAG KVAR',
    'Checkmate!':'Schackmatt!','No legal moves — draw!':'Inga drag — oavgjort!','Connected 4 in a row!':'4 i rad!',
    'Board is full':'Brädet är fullt','No moves left':'Inga drag kvar','Stockpile cleared!':'Högen tömd!',
    'With UNO!':'Med UNO!','All 144 tiles matched!':'Alla 144 brickor matchade!','Final score:':'Slutpoäng:',
    // hints / legends
    'CLICK card to SELECT (gold glow) · CLICK destination to MOVE · DOUBLE-CLICK top card → foundation · DRAG & DROP also works':'KLICKA kort för att VÄLJA (guld) · KLICKA mål för att FLYTTA · DUBBELKLICKA översta kortet → grundhög · DRA & SLÄPP funkar också',
    'CLICK card to SELECT (gold) · CLICK column to MOVE · DRAG & DROP also works':'KLICKA kort för att VÄLJA (guld) · KLICKA kolumn för att FLYTTA · DRA & SLÄPP funkar också',
    'LEFT-CLICK: REVEAL · RIGHT-CLICK or 🚩 MODE: FLAG · DOUBLE-CLICK NUMBER: CHORD':'VÄNSTERKLICK: ÖPPNA · HÖGERKLICK eller 🚩-LÄGE: FLAGGA · DUBBELKLICK PÅ SIFFRA: ACKORD',
    'ARROWS / WASD · SPACE = PAUSE · SWIPE ON TOUCH':'PILAR / WASD · MELLANSLAG = PAUS · SVEP PÅ PEKSKÄRM',
    'ARROWS / WASD / SWIPE — JOIN TILES TO REACH 2048':'PILAR / WASD / SVEP — SLÅ IHOP BRICKOR TILL 2048',
    'CAPTURES ARE FORCED · REACH THE FAR SIDE TO CROWN A KING':'SLAG ÄR TVINGADE · NÅ ANDRA SIDAN FÖR ATT BLI DAM',
    'MATCH FREE PAIRS — A TILE IS FREE IF NOTHING IS ON TOP AND ITS LEFT':'MATCHA FRIA PAR — EN BRICKA ÄR FRI OM INGET LIGGER PÅ DEN OCH DESS VÄNSTRA',
    'OR':'ELLER','RIGHT SIDE IS OPEN':'HÖGRA SIDA ÄR ÖPPEN',
    'DOUBLE-CLICK or tap any empty cell to place':'DUBBELKLICKA eller tryck på en tom ruta',
    'TAP CELL → NUMPAD  |  KEYBOARD  |  ARROWS NAVIGATE':'TRYCK RUTA → SIFFERPLATTA  |  TANGENTBORD  |  PILAR NAVIGERAR',
    'CLICK DICE TO LOCK/UNLOCK THEM':'KLICKA PÅ TÄRNINGAR FÖR ATT LÅSA/LÅSA UPP',
    'PLACE YOUR BET':'LÄGG DIN INSATS','HIT, STAND OR DOUBLE?':'KORT, STANNA ELLER DUBBLA?',
    'Roll 5 dice up to 3 times per turn.':'Kasta 5 tärningar upp till 3 gånger per tur.',
    'Lock dice to keep them. Score in 13 categories.':'Lås tärningar för att behålla dem. Poängsätt i 13 kategorier.',
    'Bonus +35 at 63 upper points. Highest total wins!':'Bonus +35 vid 63 övre poäng. Högst totalpoäng vinner!',
    'Clear your stockpile to win!':'Töm din hög för att vinna!','Build shared piles from 1 → 12.':'Bygg gemensamma högar från 1 → 12.',
    'Play from hand, stockpile, or your discard piles.':'Spela från handen, högen eller dina slänghögar.',
    'BOARD SIZE':'BRÄDSTORLEK','3×3':'3×3','5×5 (need 4)':'5×5 (kräv 4)','7×7 (need 4)':'7×7 (kräv 4)',
    'SELECT 3 CARDS TO PASS LEFT ⬅':'VÄLJ 3 KORT ATT SKICKA VÄNSTER ⬅','SELECT 3 CARDS TO PASS RIGHT ➡':'VÄLJ 3 KORT ATT SKICKA HÖGER ➡',
    'SELECT 3 CARDS TO PASS ACROSS ⬆':'VÄLJ 3 KORT ATT SKICKA ÖVER ⬆','TOP CARD':'ÖVERSTA KORT',
    // yatzy categories
    'Ones':'Ettor','Twos':'Tvåor','Threes':'Treor','Fours':'Fyror','Fives':'Femmor','Sixes':'Sexor',
    'Three of a Kind':'Tretal','Four of a Kind':'Fyrtal','Five of a Kind':'Femtal','Full House':'Kåk',
    'Sm. Straight':'Liten stege','Lg. Straight':'Stor stege','Full Straight':'Full stege','YATZY!':'YATZY!',
    'Chance':'Chans','One Pair':'Ett par','Two Pairs':'Två par','Three Pairs':'Tre par',
    'Full House (3+2)':'Kåk (3+2)','Villa (3+3)':'Villa (3+3)','Tower (4+2)':'Torn (4+2)','MAXI YATZY!':'MAXI YATZY!',
    // yatzy tooltips
    'Sum of all 1s':'Summan av alla 1:or','Sum of all 2s':'Summan av alla 2:or','Sum of all 3s':'Summan av alla 3:or',
    'Sum of all 4s':'Summan av alla 4:or','Sum of all 5s':'Summan av alla 5:or','Sum of all 6s':'Summan av alla 6:or',
    'Sum of all dice':'Summan av alla tärningar','Sum of highest pair':'Summan av högsta paret',
    'Sum of two pairs':'Summan av två par','Sum of three pairs':'Summan av tre par',
    'Sum of the three dice':'Summan av de tre tärningarna','Sum of the four dice':'Summan av de fyra tärningarna',
    'Sum of the five dice':'Summan av de fem tärningarna','Sum of those five dice':'Summan av de fem tärningarna',
    'Sum of both triples':'Summan av båda tretalen','Sum of all six dice used':'Summan av alla sex tärningarna',
    '1-2-3-4-5 = 15 pts':'1-2-3-4-5 = 15 p','2-3-4-5-6 = 20 pts':'2-3-4-5-6 = 20 p','1-2-3-4-5-6 = 21 pts':'1-2-3-4-5-6 = 21 p',
    '25 pts':'25 p','30 pts (4 in seq)':'30 p (4 i följd)','40 pts (5 in seq)':'40 p (5 i följd)',
    '50 pts (5 of a kind)':'50 p (5 lika)','100 pts (6 of a kind)':'100 p (6 lika)'
  };

  /* ─── regex fallback rules (applied when no exact match) ─── */
  var R = [
    [/^(\d+) ROLLS? REMAINING$/, '$1 KAST KVAR'],
    [/PLAYER (\d)/g, 'SPELARE $1'],
    [/'S TURN/g, ' HAR TUREN'],
    [/YOUR TURN/g, 'DIN TUR'],
    [/⬜ WHITE/g, '⬜ VIT'], [/⬛ BLACK/g, '⬛ SVART'], [/⚪ WHITE/g, '⚪ VIT'], [/⚫ BLACK/g, '⚫ SVART'],
    [/🔴 RED/g, '🔴 RÖD'],
    [/TAKES THE TRICK/g, 'TAR STICKET'],
    [/SHOT THE MOON/g, 'SKÖT MÅNEN'],
    [/LEADS WITH/g, 'BÖRJAR MED'],
    [/FOLLOW/g, 'FÖLJ'],
    [/WAITING…/g, 'VÄNTAR…'],
    [/ WINS!/g, ' VANN!'],
    [/^Score: /, 'Poäng: '], [/ \| Moves: /, ' | Drag: '], [/^Moves: /, 'Drag: '],
    [/HAND \((\d+)\/5\)/, 'HAND ($1/5)'],
    [/STOCKPILE \((\d+)\)/, 'HÖGEN ($1)'],
    [/DRAW PILE \((\d+)\)/, 'DRAGHÖG ($1)'],
    [/(\d+) CARDS/, '$1 KORT'],
    [/cards\)/, 'kort)'],
    [/ROUND/g, 'RUNDA']
  ];

  function tr(s) {
    var t = s.trim();
    if (!t) return null;
    if (D.hasOwnProperty(t)) return s.replace(t, D[t]);
    var out = t, hit = false;
    for (var i = 0; i < R.length; i++) {
      if (R[i][0].test(out)) { out = out.replace(R[i][0], R[i][1]); hit = true; }
      if (R[i][0].global) R[i][0].lastIndex = 0;
    }
    return hit ? s.replace(t, out) : null;
  }

  var translating = false;
  function walk(node) {
    if (node.nodeType === 3) {
      var v = tr(node.nodeValue);
      if (v !== null && v !== node.nodeValue) node.nodeValue = v;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.id === 'lang-fab') return;
    if (node.title) { var tv = tr(node.title); if (tv !== null) node.title = tv; }
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function translateAll(root) {
    if (cur() !== 'sv') return;
    translating = true;
    walk(root || document.body);
    translating = false;
  }

  function buildUI() {
    var style = document.createElement('style');
    style.textContent = '#lang-fab{position:fixed;left:16px;bottom:16px;z-index:9000;height:46px;padding:0 14px;border-radius:23px;' +
      'background:var(--surface2,#1a1a1a);border:2px solid var(--border,#2a2a2a);color:var(--text,#f0f0f0);' +
      'font-family:"Orbitron",monospace;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;' +
      'display:flex;align-items:center;gap:6px;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:all .2s;}' +
      '#lang-fab:hover{border-color:var(--accent,#f0c040);transform:scale(1.06);}';
    document.head.appendChild(style);

    var fab = document.createElement('button');
    fab.id = 'lang-fab';
    fab.innerHTML = '🌐 ' + (cur() === 'sv' ? 'SVE' : 'ENG');
    fab.title = cur() === 'sv' ? 'Switch to English' : 'Byt till svenska';
    fab.addEventListener('click', function () { set(cur() === 'sv' ? 'en' : 'sv'); });
    document.body.appendChild(fab);

    if (cur() === 'sv') {
      document.documentElement.lang = 'sv';
      translateAll();
      var mo = new MutationObserver(function (muts) {
        if (translating) return;
        muts.forEach(function (m) {
          if (m.type === 'characterData') { var v = tr(m.target.nodeValue); if (v !== null && v !== m.target.nodeValue) m.target.nodeValue = v; }
          m.addedNodes && m.addedNodes.forEach(function (n) { walk(n); });
        });
      });
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();
})();
