# 📺 the killer tv

A one-night social deduction party game. One website that **splits into two screens**: a
loud, ugly TV for the room, and a quiet remote for whoever's running it.

No accounts, no install, no asset files. Everything is one static page — the sound is
synthesised on the fly and the two halves talk to each other over `BroadcastChannel`, so the
game itself runs with no server at all. The only backend is one optional serverless function
that fetches a proper British narrator voice from Google Cloud; without it the browser's own
voice steps in and the game plays exactly the same.

---

## The split

You set the game up **once**, on one device:

```
 index.html  ──►  pick players ──►  build the deck ──►  [ SPLIT ]
                                                            │
                                            ┌───────────────┴───────────────┐
                                            ▼                               ▼
                                     #tv  the big screen           #admin  the remote
                                     (new window — drag             (this window stays
                                      it onto the TV)                in your hand)
```

Hitting **SPLIT** pops open the TV window and turns the window you were using into the
remote. Nobody has to type a URL twice.

- **`#tv`** — the show. Night phases in enormous type, a countdown, the vote tally, and the
  kill. It renders whatever the remote sends it and decides nothing on its own.
- **`#admin`** — the control. Next / back / pause / +30s, the running order, vote entry,
  role entry, and the verdict.

### Getting it onto an actual TV

| Setup | How |
| --- | --- |
| **Laptop → HDMI** | Drag the TV window onto the big screen, press <kbd>F</kbd> for fullscreen. |
| **Chromecast** | Chrome ⋮ → Cast → *Cast tab* → pick the TV window. |
| **Second monitor** | Same as HDMI. |

Both halves must be **the same browser on the same machine** — that's what `BroadcastChannel`
spans. A laptop plugged into the TV with the remote in a browser window on the laptop screen
is the intended setup. There's no server, so there's nothing to sync across devices.

---

## Playing

Bring physical cards, or print/write your own — the app is the narrator and the scoreboard,
not the dealer. Roles stay secret in people's hands where they belong.

1. **Deal.** One card face-down per player, three face-down in the middle.
2. **Night.** The TV calls each role in order and times it. Every card in the deck gets
   called, *including the three in the middle* — otherwise silence would be a tell.
3. **Day.** Argue. The clock runs down on the TV.
4. **The vote.** On three, everyone points. The remote records who pointed where; the TV
   tallies it live.
5. **The kill.** Most votes dies. Ties all die. If every single player takes exactly one
   vote, the mob can't agree and nobody dies.
6. **The reveal.** Everyone flips. Enter what people *ended up* holding — the Robber and
   Troublemaker will have moved things around. The TV declares the winner.

### The roles

15 cards. **The Drunk has been cut.**

| | Role | × | |
| --- | --- | --- | --- |
| 🎭 | Doppelgänger | 1 | Copy another player's card and become that role, then act on it immediately. |
| 🐺 | Werewolf | 2 | Find your pack. If you're alone, peek at one centre card. |
| 👁 | Minion | 1 | You see the wolves. They don't see you. |
| ⛏ | Mason | 2 | You know the other Mason. See none? The other one is in the middle. |
| 🔮 | Seer | 1 | Look at one player's card, or two of the centre cards. |
| 🗝 | Robber | 1 | Swap your card with another player's, then look at what you stole. |
| 🔀 | Troublemaker | 1 | Swap two *other* players' cards without looking at either. |
| ☕ | Insomniac | 1 | At the end of the night, look at your own card to see what you became. |
| 🏠 | Villager | 3 | No powers. No information. Just a mouth and a hunch. |
| 💀 | Tanner | 1 | You hate your life. You only win if the village kills you. |
| 🏹 | Hunter | 1 | If you die, whoever you pointed at dies with you. |

The deck is always **players + 3**. Suggested decks are built in for 3–10 players, or pick
your own cards — the app runs the night order for whatever you choose.

### Who wins

- **Nobody dies** → the village only gets away with it if there were no wolves among the
  players to begin with. Otherwise the wolves walk free.
- **A wolf dies** → the village wins.
- **No wolf dies** → the wolves win, and the Minion wins with them, even dead.
- **The Tanner dies** → the Tanner wins, and takes the wolves' win away with them. If a wolf
  died too, the village wins as well.
- **No wolves in the game at all and the Minion gets lynched** → the village wins.
- **No wolves in the game and an innocent gets lynched** → everybody loses.

The Doppelgänger wins and loses as whatever they copied.

---

## The narrator's voice

The TV reads the night aloud. There are two engines, and it picks the best one available.

**1. Google Cloud Text-to-Speech** — a real, deep British male voice. This is the one you
want. It runs through `api/tts.js`, a serverless function, so **the API key stays on the
server and is never sent to the browser.** Players receive MP3 bytes and nothing else.

To turn it on:

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Cloud
   Text-to-Speech API** and create an **API key**.
2. Restrict that key to the Text-to-Speech API only.
3. In Vercel → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `GOOGLE_TTS_KEY` | your API key — **required** |
   | `TTS_VOICE` | optional. Default `en-GB-Chirp3-HD-Charon` (deep British male). Also good: `en-GB-Studio-B`, `en-GB-Neural2-D` |
   | `TTS_LANG` | optional, default `en-GB` |
   | `TTS_RATE` | optional, default `0.88` — a touch slower than natural |
   | `TTS_PITCH` | optional, default `-4.0` semitones, so it sits low. Ignored by Chirp3-HD voices, which don't take a pitch |

4. Redeploy. The setup screen will say the Cloud voice is live.

A whole game is around 1,500 characters of speech, and lines are cached after first use, so
this sits inside the free tier comfortably.

**2. The browser's own voice** — the automatic fallback, used whenever no key is set, and
also if the network call fails mid-game. It hunts for a British male (`Google UK English
Male`, Ryan, George, Thomas, Daniel…) and pitches it down. If your machine has no en-GB voice
installed the setup screen tells you so — on Windows you can add one via **Settings → Time &
Language → Speech → Manage voices → English (United Kingdom)**.

Either way it's slowed and pitched down: low and deep, not a whisper. You can override the
voice, and preview it, on the setup screen.

---

## Running it

Locally it's just a folder — open `index.html`, or serve it:

```bash
npx --yes serve
```

The `/api/tts` route needs a host that runs serverless functions; without one the game
quietly falls back to the browser voice, so local play works fine.

### Deploying to Vercel

Zero config — no build step, no `package.json`. Import the repo at
[vercel.com/new](https://vercel.com/new), take every default, deploy. Vercel serves the root
as static files and turns `api/tts.js` into a serverless function on its own.

Then add `GOOGLE_TTS_KEY` (above) and redeploy to get the good voice.

Or from the CLI:

```bash
npm i -g vercel
```

```bash
vercel --prod
```

### Layout

```
index.html      all three views; a hash picks which one you get
css/app.css
js/roles.js     the 15 cards, the night order, the suggested decks
js/game.js      state shape, timers, and the rulebook (votes, deaths, who won)
js/bus.js       the wire between the two windows
js/audio.js     synthesised sound + the narrator's voice
js/setup.js     the pre-split screen
js/admin.js     the remote — owns the game state
js/tv.js        the big screen — renders it
js/main.js      routing
api/tts.js      Google Cloud TTS proxy — keeps the API key off the client
```

The remote is the single source of truth. It broadcasts the whole state object on every
change; the TV holds a copy and re-renders. Timers ship as an absolute `endsAt` so both
screens count down in step without chattering at each other.

### Keyboard

| | |
| --- | --- |
| <kbd>Space</kbd> / <kbd>→</kbd> | next (remote) |
| <kbd>←</kbd> | back (remote) |
| <kbd>P</kbd> | pause the clock (remote) |
| <kbd>F</kbd> | fullscreen (TV) |

Click the TV window once before you start — browsers won't let a page make noise until
someone has interacted with it.

---

Inspired by the one-night werewolf format. All text, code, and art here are original.
