# The Killer TV

A social deduction party game for 4–12 people around one television.

One website that **splits into two screens**: a big one for the room, and a
control panel for whoever is running the game. Set it up once, hit start, and it
asks whether you want the TV in a new window or a new tab, then hands you the
remote in the window you started from.

No server, no accounts, no build step. It works offline.

---

## The two screens

```
 index.html  ──►  players ──►  settings ──►  [ Start ]
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                          #tv  the television          #admin  the remote
                          (new window — drag it         (stays with you;
                           onto the big screen)          shows every role)
```

- **`#tv`** — what the room looks at. Dark at night, light by day. It renders
  what the remote sends it and decides nothing.
- **`#admin`** — the control panel. It knows everyone's role, calls the night in
  order, takes the killers' choice, records the vote and declares the winner.
  **Nobody but the moderator should look at it.**

Both windows have to be **the same browser on the same machine** — that is what
`BroadcastChannel` spans, and it is why there is no server to run. A laptop
plugged into the television with this page in your hand is the intended setup.

| Setup | How |
| --- | --- |
| **Laptop → HDMI** | Drag the TV window across and press <kbd>F</kbd> for fullscreen. |
| **Chromecast** | Chrome ⋮ → Cast → *Cast tab* → pick the TV window. |

---

## How a game runs

1. **Rules and story.** Four screens each, with a switch for each. The story is
   narrated; the rules are text only.
2. **Night.** The TV calls each role in turn. There is no night clock — you tap
   through at the table's pace. **The killers go last.**
3. **Dawn.** The TV holds a beat, then puts the name of whoever died on screen in
   very large type, along with what they were.
4. **Day.** A timer runs while the town argues.
5. **The vote.** Everyone points, and you record who pointed at whom. Most votes
   is out. **A tie sends it round again**, twice, and then the day is wasted.
6. Repeat until somebody wins.

The killers going **last** is what keeps the morning honest: nothing acts after
them, so the victim's role is settled the moment it is chosen and cannot be
swapped out from under the announcement.

### The roles

| Role | Max | What they do |
| --- | --- | --- |
| **Killer** | 2 | Picks someone to kill each night. Goes last. |
| **Minion** | 1 | Knows the killers. Wins with them, but dies like anyone else. |
| **Mason** | 2 | The two Masons know each other for certain. Added as a pair. |
| **Seer** | 1 | Learns exactly what one person is, each night. |
| **Robber** | 1 | Swaps roles with someone. Neither of them chose it. |
| **Troublemaker** | 1 | Swaps two *other* people's roles. Nobody is told. |
| **Insomniac** | 1 | Is shown what they have become, after everything else has moved. |
| **Doppelgänger** | 1 | Copies someone on the first night and stays that role. |
| **Hunter** | 1 | When they die, they take somebody with them. |
| **Tanner** | 1 | Wins by dying, and ends the game on the spot. |
| **Villager** | 4 | No power. A vote and an opinion. |

A role is only called if somebody **still alive** holds it, so the running order
shrinks as people die and silence never gives anything away.

The Doppelgänger overwrites rather than swaps, so after the first night nobody
holds that role and it never wakes again. That is deliberate, and the call says so.

### How it ends

Checked after every death, in this order:

- **The Tanner dies**, by any hand → the Tanner wins alone, immediately.
- **No killers left** → the town wins.
- **The killers equal everyone else** → they cannot be outvoted, so they win.

---

## The narrator

**Twenty-four lines, and that is all there will ever be.** No player name is ever
spoken — the voice says "somebody did not make it through the night" and the TV
puts the name up in huge type — which is what stops the list growing.

Only the night calls genuinely have to be spoken, because at that point
everyone's eyes are shut and the screen is no use to them. Everything else is
spoken because it's nice to have, and **each category has its own switch** in
settings, so you can hand yourself as much of the hosting as you want:

| Category | Lines |
| --- | --- |
| The story | 4 |
| Role calls | 11 |
| Deaths | 4 |
| Day prompts | 2 |
| The ending | 3 |

With nothing in `/audio` the browser's own speech engine reads them, so the game
talks out of the box. Drop MP3s named after the line ids into `/audio`, list them
in `audio/manifest.json`, and those get used instead. See **[AUDIO.md](AUDIO.md)**.

---

## Running it

It's a folder of static files. Open `index.html`, or serve it:

```bash
npx --yes serve
```

### Deploying

Zero config, no build, no `package.json`. Import at
[vercel.com/new](https://vercel.com/new) and take the defaults. Vercel serves the
root and turns `api/tts.js` into a serverless function on its own.

`api/tts.js` is optional: set `GEMINI_API_KEY` (or `GOOGLE_TTS_KEY`) and it
generates speech through Gemini or Google Cloud, with the key staying on the
server. Without it, nothing breaks — the browser voice covers it.

### Layout

```
index.html      all three screens; the hash picks one
css/app.css
js/roles.js     the cast, the night order, suggested line-ups
js/lines.js     the twenty-four lines, plus the rules and story screens
js/state.js     game state and the rulebook — plain functions, no DOM
js/bus.js       the wire between the two windows
js/audio.js     synthesised effects, and the narrator
js/setup.js     the sheet before the split
js/admin.js     the remote — owns the game
js/tv.js        the television — renders it
js/main.js      routing
api/tts.js      optional speech proxy; keeps the API key off the client
tools/          scripts that build the audio pack
```

The remote is the single source of truth and broadcasts the whole state on every
change. Timers travel as an absolute `endsAt` so both screens agree without
chattering at each other.

### Keyboard

| | |
| --- | --- |
| <kbd>Space</kbd> / <kbd>→</kbd> | Next (remote) |
| <kbd>←</kbd> | Back — undoes the current night action (remote) |
| <kbd>F</kbd> | Fullscreen (TV) |

Click the TV window once before you start; browsers keep a page silent until
somebody has interacted with it.
