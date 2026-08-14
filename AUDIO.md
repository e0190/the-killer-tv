# The narration pack

**The pack is already built and committed.** All 64 lines are in `/audio` and
deploy with the site, so the game talks out of the box with no key, no account
and nothing to install. You only need the rest of this page if you want to
replace it.

## What's in there now, and its one flaw

Generated with `tools/generate-audio-sapi.ps1` from the speech engine built into
Windows, pitched down and slowed by ffmpeg so it reads as a narrator rather than
a sat-nav. 64 clips, about five minutes of audio, 2.5 MB.

The flaw: **it is American**. The only voices on the machine that built it were
Microsoft David and Zira, both en-US. It is deep and it is measured, but it is
not the British narrator this game wants. Replacing it is the single biggest
upgrade available, and there are three ways to do it.

## 1. Drop your own recordings into the setup page

Easiest, and it doesn't touch the repo.

1. Record or generate the 64 files. Name each after its line id — `tut_killer.mp3`,
   `opening_doors.mp3`, `call_killer.mp3` — exactly as listed below.
2. Open the site. There's a banner at the top of the setup page.
3. Hit **replace it**, then drag all 64 onto the drop zone in one go.

They're matched by filename, stored in this browser, and take priority over the
committed pack. Messy filenames are fine: `03 Call_Killer.MP3` still lands on
`call_killer`. Anything you skip keeps using the shipped clip, so you can replace
them a handful at a time.

**copy the script** on that panel puts the whole list on your clipboard as
`filename<tab>text`, ready to paste into whatever you're generating with.

## 2. Rebuild the committed pack on Windows

```bash
node -e "const fs=require('fs');const s={};new Function('x',fs.readFileSync('js/lines.js','utf8').replace(/^const LINES/m,'x.LINES').replace(/^const LINE_IDS[\s\S]*$/m,''))(s);fs.writeFileSync('audio/_lines.json',JSON.stringify(s.LINES,null,1))"
```

```bash
powershell -ExecutionPolicy Bypass -File tools/generate-audio-sapi.ps1 -Force
```

The first command exports the script from `js/lines.js`; the second speaks it.
Flags: `-Voice 'Microsoft Zira Desktop'`, `-Rate -4` (slower), `-Pitch 0.8`
(deeper), `-Only tut_killer,day`, `-Force`.

**To get a British voice**, install one first: Settings, Time and Language,
Speech, Manage voices, add English (United Kingdom). Then pass it with `-Voice`.

## 3. Have Google generate it

```bash
node tools/generate-audio.js
```

Needs `GOOGLE_TTS_KEY`. Writes MP3s into `/audio` and rewrites the manifest.
See the README for which kind of Google key you need — there are two and they
are not interchangeable.

## The manifest

`audio/manifest.json` lists which line ids actually exist and what format they
are in. The app reads it so it never has to probe. Regenerate it after adding
files by hand:

```bash
node tools/generate-audio.js --manifest-only
```

## Direction, if you're recording these yourself

Deep, unhurried, quiet — somebody telling you something grim they've told a
hundred times before. Not a whisper, not a shout, no relish. Leave about half a
second of silence at the top and tail so the cuts don't clip.

Resist the urge to perform them. They're short on purpose; let them land flat.

## The lines

### The tutorial - how to play, ten screens

| file | what it says |
| --- | --- |
| `tut_killer.mp3` | Somebody at this table is the Killer. |
| `tut_secret.mp3` | Only you know what you are. Keep it that way. |
| `tut_night.mp3` | When the television says so, everybody closes their eyes. |
| `tut_called.mp3` | Roles are called one at a time. Wake only on yours. |
| `tut_choice.mp3` | The Killer is called last, and picks somebody. |
| `tut_morning.mp3` | By morning that person is dead, and you all find out. |
| `tut_day.mp3` | Then you argue about who did it. |
| `tut_vote.mp3` | Then everybody points at once. Most votes hangs. |
| `tut_win.mp3` | Hang the Killer and the town lives. Otherwise it does not. |
| `tut_remote.mp3` | Whoever holds the remote sees everything. Never look at it. |

### The prologue - eleven short beats before the first night

| file | what it says |
| --- | --- |
| `opening_doors.mp3` | Nobody in this town locks their doors. Never had to. |
| `opening_ellis.mp3` | Ellis Kane didn't come in from the yard on Tuesday. |
| `opening_found.mp3` | They found him Thursday. Some of him. |
| `opening_more.mp3` | Then Sarah Vance. Then the Pryor boy. |
| `opening_inside.mp3` | Every one of them died inside their own house. |
| `opening_bolted.mp3` | And every door was still bolted from the inside. |
| `opening_forced.mp3` | No broken window. No forced lock. Nothing. |
| `opening_opened.mp3` | Which means they opened the door themselves. |
| `opening_smiled.mp3` | They knew the face on the step. They smiled at it. |
| `opening_left.mp3` | There is nobody left in this town but you. |
| `opening_tonight.mp3` | One of you does it again tonight. Close your eyes. |

### Nightfall

| file | what it says |
| --- | --- |
| `night_first.mp3` | Lights out. Everybody close your eyes. |
| `night_again.mp3` | Another night. Close your eyes. |
| `sleep.mp3` | Close your eyes. |

### Calls - every night

| file | what it says |
| --- | --- |
| `call_doppelganger.mp3` | Doppelgänger, wake. Point at someone. You are them now. |
| `call_minion.mp3` | Minion, wake. Killer, show yourself. |
| `call_mason.mp3` | Masons, wake. Find each other. |
| `call_seer.mp3` | Seer, wake. Point at one person. |
| `call_robber.mp3` | Robber, wake. Point at someone. Take what they are. |
| `call_troublemaker.mp3` | Troublemaker, wake. Swap two people. |
| `call_insomniac.mp3` | Insomniac, wake. Look at what you are. |
| `call_killer.mp3` | Killer, wake. Choose who dies tonight. |

### The Doppelganger rules - said straight after its call

| file | what it says |
| --- | --- |
| `dg_act.mp3` | If that role is called tonight, act on it. |
| `dg_keep.mp3` | You are that role from now on. |

### Morning

| file | what it says |
| --- | --- |
| `dawn.mp3` | Open your eyes. |
| `dawn_body.mp3` | There is a body in the square. |
| `dawn_quiet.mp3` | Everybody is still breathing. For now. |

### What the body turns out to be

| file | what it says |
| --- | --- |
| `reveal_guilty.mp3` | You got the Killer. |
| `reveal_innocent.mp3` | Not the Killer. You got that wrong. |
| `reveal_killer.mp3` | This one was the Killer. |
| `reveal_minion.mp3` | This one was the Minion. |
| `reveal_mason.mp3` | This one was a Mason. |
| `reveal_seer.mp3` | This one was the Seer. |
| `reveal_robber.mp3` | This one was the Robber. |
| `reveal_troublemaker.mp3` | This one was the Troublemaker. |
| `reveal_insomniac.mp3` | This one was the Insomniac. |
| `reveal_doppelganger.mp3` | This one was the Doppelgänger. |
| `reveal_hunter.mp3` | This one was the Hunter. |
| `reveal_tanner.mp3` | This one was the Tanner. That look is relief. |
| `reveal_villager.mp3` | This one was nobody. Just a villager. |

### Day and the vote

| file | what it says |
| --- | --- |
| `day.mp3` | Talk. Somebody here is lying. |
| `vote_call.mp3` | Hands up. Point at who hangs. |
| `vote_again.mp3` | No majority. Point again. |
| `vote_three.mp3` | Three. |
| `vote_two.mp3` | Two. |
| `vote_one.mp3` | One. |
| `vote_point.mp3` | Point. |
| `lynch_body.mp3` | The village has decided. |
| `lynch_none.mp3` | No agreement. Nobody hangs tonight. |

### The Hunter

| file | what it says |
| --- | --- |
| `hunter_dies.mp3` | The Hunter is armed. Choose. |
| `hunter_shot.mp3` | The shot goes off. |

### Endings

| file | what it says |
| --- | --- |
| `win_village.mp3` | The Killer is dead. It is over. |
| `win_killers.mp3` | There is nobody left to stop them. |
| `win_tanner.mp3` | The Tanner wanted this. The Tanner wins. |

