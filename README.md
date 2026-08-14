# The Killer TV

A social deduction party game for 4–12 people around one television. One website
that **splits into two screens**: a big, slow, unpleasant TV for the room, and a
quiet control panel for whoever is running it.

Inspired by the one-night werewolf format, but it is not a one-night game. It runs
night after night until somebody wins. **The Drunk has been cut, and the werewolf is now simply the Killer.**

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
  in order, takes the Killer's choice and the Seer's answer, records the vote, and
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

1. **The tutorial.** Ten screens explaining the game to people who've never played it.
   Skippable from the remote, or switch it off in the house rules.
2. **The prologue.** Eleven beats of story: a town where nobody locks up, three people
   dead inside their own bolted houses, and no sign of a forced door. Which leaves
   exactly one explanation, and the table usually gets there a beat before the TV does.
3. **Night.** The TV calls each role in turn. **There is no night clock** — you tap
   through at the table's pace. Every role acts **every night** — bar the Doppelgänger,
   who only ever goes once — so nobody's role is safe for long. **The Killer goes
   last**, and nobody dies until morning.
4. **Wake up.** Everyone opens their eyes, then the TV counts **three, two, one**
   before it shows who didn't make it — name in letters a foot high, and what they
   were, or just whether they were the Killer, your call.
5. **Day.** A timer runs on the TV while the village argues.
6. **The vote.** The TV counts down, everyone points, *then* the tally sheet appears
   on the remote. Most votes hangs, after another three-count. **A tie sends it back
   for a revote** — twice, and if they still can't agree, nobody hangs.
7. Repeat until it's over.

The Killer waking **last** is what keeps the morning honest: nothing acts after
them, so the victim's role is settled the instant it's chosen and cannot be swapped
out from under the announcement. The Minion still sees who it is — a hand goes up
without eyes opening.

### The night, in order

| | Role | What they do at night |
| --- | --- | --- |
| D | Doppelgänger | **First night only.** Takes one person’s role; if that role is called later the same night, they act on it. The Doppelgänger is gone by morning. |
| M | Minion | Knows the Killer. The Killer never knows them. |
| S | Mason ×2 | Recognise each other. Always added and removed as a pair. |
| E | Seer | Inspects one player; the moderator is shown **exactly what they are**, to signal in silence. |
| R | Robber | Swaps roles with someone. Both of them are now something else. |
| T | Troublemaker | Swaps two *other* people's roles. Neither is told. |
| I | Insomniac | Is shown what they have become — after everything above has moved. |
| K | Killer ×2 | **Last.** Choose who does not see morning. |

Three more never wake: **Hunter** (when they die, they take somebody with them),
**Tanner** (wants to die), **Villager** (up to four; no powers, just a vote).

A role is only called if somebody **still alive** is holding it — so the running
order shrinks as people die, and silence is never a tell.

### How it ends

Three ways out, checked after every death:

- **The Tanner dies**, by any hand → the Tanner wins alone and it stops there.
- **No killers left standing** → the village wins.
- **The killers have it down to one last villager** → the killers win.

The Minion wins whenever the killers do, alive or dead. The Doppelgänger wins as
whatever it became. The dead still win — Hunters especially.

---

## The narrator

**It already talks.** All **64 lines** are generated and committed in `/audio`, so the
game narrates itself out of the box — no key, no account, nothing to install. There
are never any more than 64, because **no player names are ever spoken**.

The catch: the committed pack was built from the Windows speech engine and is
**American**. Deep and slow, but not British. Swapping it is the biggest single
upgrade going — see **[AUDIO.md](AUDIO.md)** for the three ways to do it, the
quickest being to drag your own 64 files onto the banner on the setup page.

Four tiers, best available wins, each falling through to the next so the narrator is
never silent:

1. **Recordings you dropped into the setup page** — stored in this browser.
2. **The pack committed to `/audio`** — ships with the site, works for everyone.
3. **Generated speech** via `api/tts.js`, if `GOOGLE_TTS_KEY` is set. The key lives in
   a Vercel environment variable and is **never sent to the browser**.
4. **The browser's own voice**, hunting for a British male and pitching it down.

### Which Google key you have matters

There are two, they look identical, and they are not interchangeable:

| Key from | Works with | Set |
| --- | --- | --- |
| [aistudio.google.com](https://aistudio.google.com/apikey) | Gemini TTS | `GEMINI_API_KEY` (or `GOOGLE_TTS_KEY`), and optionally `TTS_BACKEND=gemini` |
| Google Cloud console | Cloud Text-to-Speech (must be enabled on the project) | `GOOGLE_TTS_KEY`, and optionally `TTS_BACKEND=cloud` |

`TTS_BACKEND` defaults to `auto`, which tries Gemini first and falls back to Cloud if
the key is rejected — so either kind should just work. An AI Studio key sent to Cloud
TTS fails with `API_KEY_INVALID`, which is the usual way to get this wrong. `GET
/api/tts` reports which backend is live; a failed `POST` tells you why.

Gemini TTS needs a **billing-enabled** project — AI Studio gates the speech playground behind
`Link a paid API key`. A key alone may not be enough.

Other optional vars: `TTS_MODEL` (default `gemini-3.1-flash-tts-preview`), `TTS_VOICE` (Gemini default `Charon`, Cloud default
`en-GB-Chirp3-HD-Charon`), `TTS_STYLE`, `TTS_LANG`, `TTS_RATE`, `TTS_PITCH`.

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
generated speech — see the key table above.

### Layout

```
index.html          all three views; a hash picks which one you get
css/app.css
js/roles.js         the cast, the night order, the tutorial and prologue beats
js/lines.js         every word the narrator says — the audio pack's source of truth
js/pack.js          dropped-in narration files, stored in the browser
js/scenes.js        the line art
js/game.js          state, night actions, votes, and the three endings
js/bus.js           the wire between the two windows
js/audio.js         synthesised effects + the three-tier narrator
js/setup.js         the pre-split sheet
js/admin.js         the remote — owns the game
js/tv.js            the big screen — renders it
js/main.js          routing
api/tts.js          Google Cloud TTS proxy — keeps the key off the client
tools/generate-audio.js       builds the pack via Google Cloud TTS
tools/generate-audio-gemini.js builds the pack via Gemini TTS
tools/generate-audio-sapi.ps1 builds the pack from the Windows speech engine
audio/                        the committed narration, 72 clips
```

The remote is the single source of truth and broadcasts the whole state on every
change. Timers ship as an absolute `endsAt` so both screens count down in step.

### The narrator's three modes

Set in the house rules, and it only changes what is **spoken** — every word stays
on screen regardless.

| Mode | What you hear |
| --- | --- |
| **everything** | The story, the role calls, the verdicts. |
| **story only** | Just the prologue and the first-night atmosphere. You call the roles yourself, like a proper moderator. |
| **silent** | Nothing spoken at all. Sound effects still play unless you turn those off too. |

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
