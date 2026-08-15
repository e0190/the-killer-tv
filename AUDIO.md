# The narration pack

There are **24 lines**, and that is the whole list. It never grows, because **no
player name is ever spoken** — the voice says "somebody did not make it through
the night" and the television puts the name on screen instead.

**You don't have to record any of them.** With `audio/` empty the browser reads
everything itself and the game works fine. This page is only for making it sound
better than that.

Only the 11 role calls genuinely need to be spoken, because at that point
everyone's eyes are shut and the screen is no use to them. The other nine are
there for atmosphere, and each category can be switched off in settings if you'd
rather say it yourself.

## Adding your own

1. One file per line, named after its id — `call_killer.mp3`, `died.mp3`.
2. Drop them in `audio/`.
3. List the ids you actually made in `audio/manifest.json`:

```json
{ "format": "mp3", "lines": ["call_killer", "died"] }
```

Anything not listed falls back to the browser voice, so you can do a handful at a
time. Commit them and they deploy with the site.

## Or generate them

```bash
node tools/generate-audio-gemini.js
```

Needs `GEMINI_API_KEY` from [aistudio.google.com](https://aistudio.google.com/apikey).
Writes every line, converts to MP3 if ffmpeg is on PATH, and rewrites the
manifest for you. Be aware that Gemini speech may need billing enabled on the
project — a key on its own isn't always enough.

On Windows, with no key and no internet:

```bash
powershell -ExecutionPolicy Bypass -File tools/generate-audio-sapi.ps1
```

That drives the speech engine built into Windows and pitches it down with ffmpeg.
It works, and it sounds like Windows. For a British one, add an en-GB voice under
Settings → Time & Language → Speech first, then pass `-Voice "Microsoft George"`.

## If you're recording them yourself

Deep, unhurried, quiet. Leave about half a second of silence at each end so the
cuts don't clip. Don't perform them — they're short on purpose.

## The lines

### The story (4)

| file | what it says |
| --- | --- |
| `story_1.mp3` | The snow came early this year and took the road with it. |
| `story_2.mp3` | Forty houses, one church, one inn, and the woods behind all of it. |
| `story_3.mp3` | Nobody here has locked a door in living memory. There was never any reason to. |
| `story_4.mp3` | It is a long winter, and the nights are very long indeed. |

### Role calls (11)

| file | what it says |
| --- | --- |
| `eyes_shut.mp3` | Everyone, close your eyes. |
| `eyes_open.mp3` | Everyone, open your eyes. |
| `sleep.mp3` | Close your eyes. |
| `call_doppelganger.mp3` | Doppelgänger, open your eyes. Point at someone. You are that role now. |
| `call_minion.mp3` | Minion, open your eyes. Killer, raise a hand so your minion can see you. |
| `call_mason.mp3` | Masons, open your eyes and find each other. |
| `call_seer.mp3` | Seer, open your eyes. Point at one person. |
| `call_robber.mp3` | Robber, open your eyes. Point at someone. You take their role, they take yours. |
| `call_troublemaker.mp3` | Troublemaker, open your eyes. Point at two other people. Their roles swap. |
| `call_insomniac.mp3` | Insomniac, open your eyes and see what you are now. |
| `call_killer.mp3` | Killers, open your eyes. Choose who dies tonight. |

### Deaths (4)

| file | what it says |
| --- | --- |
| `died.mp3` | Somebody did not make it through the night. |
| `survived.mp3` | Everyone is still here. For now. |
| `hanged.mp3` | The town has decided. |
| `no_majority.mp3` | No majority. Nobody goes. |

### Day prompts (2)

| file | what it says |
| --- | --- |
| `talk.mp3` | Talk it out. One of you is lying. |
| `vote.mp3` | Time to vote. Point at who you want gone. |

### The ending (3)

| file | what it says |
| --- | --- |
| `win_town.mp3` | The killers are dead. The town survives. |
| `win_killers.mp3` | There is nobody left to stop them. |
| `win_tanner.mp3` | The Tanner got exactly what they wanted. |

