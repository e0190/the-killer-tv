# The Killer TV

A social deduction party game for 4–12 people around one television. One website
that **splits into two screens**: a big, slow, unpleasant TV for the room, and a
quiet control panel for whoever is running it.

Inspired by the one-night werewolf format, but it is not a one-night game. It runs
night after night until somebody wins. **The Drunk has been cut.**

The game itself needs no server — the two halves talk to each other directly, and
it works offline. The only optional backend is a serverless function that fetches
a narrator voice, and even that has a fallback.

---

## The split

You set the game up **once**, on one device:

```
 index.html  ──►  the cast ──►  house rules ──►  [ BEGIN ]
                                                     │
                                     ┌───────────────┴───────────────┐
                                     ▼                               ▼
                              #tv  the big screen          #admin  the remote
                              (new window — drag            (stays in your hand;
                               it onto the television)        shows every role)
```

**BEGIN** pops open the TV window and turns the window you were using into the
remote. Nobody types a URL twice.

- **`#tv`** — the show. Story, line art, the night calls, the countdown, and the
  bodies. It renders what the remote sends and decides nothing.
- **`#admin`** — the control panel. It knows every player's role, runs the night
  in order, takes the wolves' choice and the Seer's answer, records the vote, and
  calls the ending. **Nobody but the moderator should look at it.**

Both halves must be **the same browser on the same machine** — that's what
`BroadcastChannel` spans. A laptop plugged into the telly, this page in your hand,
is what it's built for.

| Setup | How |
| --- | --- |
| **Laptop → HDMI** | Drag the TV window across, press <kbd>F</kbd> for fullscreen. |
| **Chromecast** | Chrome ⋮ → Cast → *Cast tab* → pick the TV window. |

---

## How a game runs

There are no cards in the middle any more. Everyone holds exactly one role, you
enter the whole cast at setup, and the app runs the rest.

1. **Night.** The TV calls each role in turn. **There is no night clock** — you tap
   through at the table's pace. Every role acts **every night**, so nobody's role is
   safe for long.
2. **Dawn.** Whoever the wolves chose is dead. The TV puts the name up in letters a
   foot high and says what they were — or just whether they were a wolf, your call.
3. **Day.** A timer runs on the TV while the village argues.
4. **The vote.** Everyone points. Most votes hangs. **A tie means nobody hangs.**
5. Repeat until it's over.

### The night, in order

| | Role | What they do, every night |
| --- | --- | --- |
| D | Doppelgänger | Points at someone and becomes their role. Again. And again. |
| W | Werewolf ×2 | Find each other, then choose who doesn't see morning. |
| M | Minion | Sees the wolves. The wolves never see them. |
| S | Mason ×2 | Recognise each other. Always added and removed as a pair. |
| E | Seer | Inspects one player; the moderator signals wolf or not. |
| R | Robber | Swaps roles with someone. Both of them are now something else. |
| T | Troublemaker | Swaps two *other* people's roles. Neither is told. |
| I | Insomniac | Is shown what they have become. |

Three more never wake: **Hunter** (when they die, they take somebody with them),
**Tanner** (wants to die), **Villager** (up to four; no powers, just a vote).

A role is only called if somebody **still alive** is holding it — so the running
order shrinks as people die, and silence is never a tell.

### How it ends

Three ways out, checked after every death:

- **The Tanner dies**, by any hand → the Tanner wins alone and it stops there.
- **No wolves left standing** → the village wins.
- **The wolves have it down to one last villager** → the wolves win.

The Minion wins whenever the wolves do, alive or dead. The Doppelgänger wins as
whatever it last copied. The dead still win — Hunters especially.

---

## The narrator

Read **[AUDIO.md](AUDIO.md)**. There are **49 lines**, that's the complete and final
list, and it never grows — **no player names are ever spoken**, so the pack is fixed
forever. Record them once, drop the MP3s in `/audio`, done.

Three tiers, best available wins, each falling through to the next so the narrator
is never silent:

1. **Your files** in `/audio` — see AUDIO.md.
2. **Google Cloud TTS** via `api/tts.js`, if `GOOGLE_TTS_KEY` is set. The key lives
   in a Vercel environment variable and is **never sent to the browser**.
3. **The browser's own voice**, hunting for a British male and pitching it down.

To generate the whole pack with Google's British voice in one command:

```bash
node tools/generate-audio.js
```

---

## Running it

Locally it's just a folder — open `index.html`, or serve it:

```bash
npx --yes serve
```

### Deploying to Vercel

Zero config, no build step, no `package.json`. Import at
[vercel.com/new](https://vercel.com/new) and take every default. Vercel serves the
root as static files and turns `api/tts.js` into a serverless function on its own.

Add `GOOGLE_TTS_KEY` in Settings → Environment Variables and redeploy if you want
tier 2. Optional: `TTS_VOICE` (default `en-GB-Chirp3-HD-Charon`), `TTS_LANG`,
`TTS_RATE`, `TTS_PITCH`.

### Layout

```
index.html          all three views; a hash picks which one you get
css/app.css
js/roles.js         the cast, the night order, suggested line-ups
js/lines.js         every word the narrator says — the audio pack's source of truth
js/scenes.js        the line art
js/game.js          state, night actions, votes, and the three endings
js/bus.js           the wire between the two windows
js/audio.js         synthesised effects + the three-tier narrator
js/setup.js         the pre-split sheet
js/admin.js         the remote — owns the game
js/tv.js            the big screen — renders it
js/main.js          routing
api/tts.js          Google Cloud TTS proxy — keeps the key off the client
tools/generate-audio.js   builds the whole audio pack in one go
```

The remote is the single source of truth and broadcasts the whole state on every
change. Timers ship as an absolute `endsAt` so both screens count down in step.

### Keyboard

| | |
| --- | --- |
| <kbd>Space</kbd> / <kbd>→</kbd> | next (remote) |
| <kbd>←</kbd> | back — undoes the current night action (remote) |
| <kbd>F</kbd> | fullscreen (TV) |

Click the TV window once before you start; browsers won't let a page make noise
until somebody has interacted with it.

---

All text, code, and art here are original.
