# The narration pack

There are **20 lines**, and that is the whole list. It never grows, because **no
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

