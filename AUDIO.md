# The narration pack

There are **20 lines**, and that is the whole list. It never grows, because
**no player name is ever spoken** — the voice says "somebody did not make it
through the night" and the television puts the name on screen.

**You do not have to record any of them.** With  empty the browser reads
everything itself and the game works fine. This is only if you want it to sound
better than that.

## Adding your own

1. Make one file per line, named after its id: , .
2. Put them in .
3. List the ids you actually made in :



Anything not listed falls back to the browser voice, so you can do a handful at
a time. Commit them and they deploy with the site.

## Or generate them



Needs  from [aistudio.google.com](https://aistudio.google.com/apikey).
Writes every line, converts to MP3 if ffmpeg is around, and rewrites the
manifest. Note that Gemini speech may require billing enabled on the project.

On Windows, with no key and no internet:



That uses the speech engine built into Windows, pitched down by ffmpeg. It works,
and it sounds like Windows. Add an en-GB voice under Settings → Time & Language →
Speech first if you want it British.

## If you are recording these yourself

Deep, unhurried, quiet. Leave about half a second of silence at each end so the
cuts do not clip. Do not perform them — they are short on purpose.

## The lines

### Role calls

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

### Deaths

| file | what it says |
| --- | --- |
| `died.mp3` | Somebody did not make it through the night. |
| `survived.mp3` | Everyone is still here. For now. |
| `hanged.mp3` | The village has decided. |
| `no_majority.mp3` | No majority. Nobody hangs. |

### Day prompts

| file | what it says |
| --- | --- |
| `talk.mp3` | Talk it out. One of you is lying. |
| `vote.mp3` | Time to vote. Point at who you want gone. |

### The ending

| file | what it says |
| --- | --- |
| `win_town.mp3` | The killers are dead. The town survives. |
| `win_killers.mp3` | There is nobody left to stop them. |
| `win_tanner.mp3` | The Tanner got exactly what they wanted. |

