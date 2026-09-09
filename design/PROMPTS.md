# Prompts for Claude Design

Six prompts. Run them **in order** — each one after the first refers back to what
the earlier ones settled, so the whole thing hangs together instead of being six
unrelated pictures.

Every prompt is self-contained: Claude Design starts cold and knows nothing about
this game, so each one repeats the facts it needs.

**Hard constraints, carried through all six:** all type is serif; white is
off-white, never `#fff`; it is played in a dim room around a television.

---

## 1 · The look

```
I'm designing a social deduction party game called The Killer TV. It's played in
a living room: one television shows the game to everybody, and the person running
it holds a phone. Werewolf/mafia family — one player is the Killer, the town
votes each day, it runs over several nights until either the killers are dead,
they outnumber everyone, or the Tanner gets killed and wins by dying.

I need the art direction before anything else. Give me:

- a palette for night and a palette for day — the TV is dark for the night
  phases and flips to a light background at dawn
- a serif type scale that survives being read from a sofa three metres away
- one accent colour that means death and nothing else
- the texture/finish decision: paper, ink, film grain, none of it — pick one and
  say why

The palette is for the screens only. The physical cards print in a single black
ink with no greys at all, so don't let the art direction depend on colour or
tone to work — whatever carries the identity has to survive being reduced to
pure black line on bare paper.

Rules: everything serif, no sans anywhere. White is always an off-white — warm,
like paper under a lamp — never pure white. Warm blacks, not blue-blacks; this is
lamplight, not a dashboard. It should feel like an old parlour game somebody
found in a cupboard, not a startup's landing page.

Show it as a one-page style sheet with real swatches and real type specimens, and
give me the colours as CSS custom properties I can paste in.
```

---

## 2 · The cards

```
Design the deck for a social deduction party game called The Killer TV, using the
art direction from the style sheet above.

These are cards the players physically hold — dealt face down, looked at once,
and hidden for the rest of the game. So: readable in a dim room at a glance, and
completely opaque from the back. No card can be identifiable by its edge, its
thickness, or anything showing through from the front.

The cards print in one ink: pure black on bare paper. No colour, and no greys —
no tints, no screens, no halftones, no soft shadows, no 60%-black anything. Every
mark is either full black or nothing. Tone can only come from line: hatching,
stippling, varying weight, or letting white space do the work. If a drawing needs
grey to read, it's the wrong drawing.

That constraint is the interesting part of this brief, not a limitation to work
around. One ink, in a dim room, is how playing cards and tarot decks have always
worked — they're legible at a glance because the shapes are strong, not because
they're rendered.

The deck is 16 cards across 11 roles. Several roles appear more than once:

  4 x Villager      No power. A vote and an opinion.
  2 x Killer        Picks someone to kill each night.
  2 x Mason         The two Masons know each other for certain.
  1 x Minion        Knows the Killer. Wins with them, but dies like anyone else.
  1 x Seer          Learns exactly what one person is, each night.
  1 x Robber        Swaps roles with someone. Neither of them chose it.
  1 x Troublemaker  Swaps two other people's roles. Nobody is told.
  1 x Insomniac     Is shown what they have become, after everything else moved.
  1 x Doppelganger  Copies someone on the first night and stays that role.
  1 x Hunter        When they die, they take somebody with them.
  1 x Tanner        Wins by dying, and ends the game on the spot.

Each card carries the role name, a mark or small illustration, and the one line
above saying what it does.

Two rules that matter more than anything aesthetic:

1. The duplicates must be genuinely identical. The four Villagers have to be the
   same card, not four variations — if a player can tell one Villager from
   another, they can start tracking cards between rounds and the game breaks.
   Same for the two Killers and the two Masons. Print eleven designs, not sixteen.

2. Which side a role is on must not be readable off the front. A player who
   glimpses someone else's card should learn nothing about whether they're a
   killer. With colour gone, the giveaway would be a shared motif, a common
   border, or a repeated symbol binding the town roles together — so don't. Every
   card is distinguished per-role, never per-team, and the Killer and Minion must
   not resemble each other in any way a stranger could spot.

The Doppelganger is the odd one: it copies another role on the first night and
then permanently is that role, so its card stops being true partway through the
game. If there's a nice way to acknowledge that on the card, take it.

Give me one shared back, the eleven fronts, a layout sheet showing all 16 cards
as they'd actually be printed, and a note on card size and stock. Vector, black
only — nothing that would fall apart printed at home on a laser printer.
```

---

## 3 · The setup screen

```
Design the setup screen for The Killer TV, a social deduction party game, in the
art direction from the style sheet above. This is the first thing you see — one
page on a laptop, before the game splits into a TV window and a phone remote.

Everything on it:

- Players. A stepper for four to twelve, and for each player a name field and a
  role picker. A "Suggest roles" button fills a sensible line-up. Below it, a
  running tally of the cast, and a list of anything wrong with it ("Masons come
  as a pair", "There is no Killer, so nobody can lose") that blocks starting.

- Game. Two toggles — show the rules first, show the story first. A two-way
  choice for what the town is told about a body: their role, or just killer or
  not. A dropdown for how long the day lasts.

- Narration. Per-category switches for what the television reads aloud versus
  what the host says themselves, a voice picker, a "Test voice" button, and a
  sound-effects toggle.

- A big "Start the game" button pinned to the bottom, disabled until the cast is
  legal, with one line under it saying what's still missing.

The hard part is the player list: twelve rows of name-plus-role is a lot of form,
and it's the first impression. Make that specific bit feel like dealing cards out
onto a table rather than filling in a spreadsheet.

Desktop-first, but it has to survive a narrow window. Show me the full screen at
eight players, plus a close-up of one player row and of the cast tally.
```

---

## 4 · The remote

```
Design the moderator's screen for The Killer TV, a social deduction party game —
the art direction is in the style sheet above. It's a phone held by the one
person running the game, in a dark room, while everybody else watches a
television. They are talking out loud the whole time and glancing down. So: one
decision per screen, large targets, nothing that needs a second look.

The states to design:

1. A night call. A line of script to read out ("Seer, open your eyes. Point at
   one person."), then a grid of players to tap whoever they pointed at. Back and
   Next along the bottom.

2. A night call nobody can answer. Same script, no picker — the role is dead but
   must still be called so the silence doesn't give it away. Needs a note
   explaining why, without the moderator's face saying "this one's fake".

3. A private answer. What the Seer saw, or what the Insomniac became —
   moderator's eyes only, must look unmistakably not-for-the-room.

4. The day. A countdown, pause, +30s.

5. The vote. Every living player, each needing a target recorded. The button says
   how many are still missing.

6. The roster, always at the bottom: everyone, their real current role, who's
   dead. The one screen that would ruin the game if the room saw it.

That last point is the whole brief: the moderator will be holding this at a table
of people who all want to look at it. Design it so a glance from across the room
gives nothing away, but the host can read it in a second.

Show all six states as phone screens.
```

---

## 5 · The television

```
Design the television screen for The Killer TV, a social deduction party game —
art direction is in the style sheet above. This is on a TV across the room, seen
by six to twelve people at once, some of them standing. Nobody touches it. Very
few words, very large. No player names ever appear here.

The states:

1. Night. Whose turn it is, as an instruction to the room.

2. Dawn, before the reveal. The town wakes. A held pause — two or three seconds
   of nothing, on purpose.

3. Dawn, the body. Who died and what they were. The single most dramatic moment
   in the game; it should land like a slap. Note that sometimes the screen says
   only "A KILLER" / "NOT A KILLER" instead of the role.

4. Day. A big countdown with a progress track, while the town argues.

5. The verdict. Who the town voted out, and what they turn out to have been.

6. The end. Three different endings — the town wins, the killers win, or the
   Tanner wins by having been killed. The Tanner one should feel like a joke
   landing, not a victory.

Night states are dark; from dawn onward the background flips to the warm
off-white and everything on screen picks up colour. Design that flip — it's the
moment the room exhales, and it should be visible from the doorway.

Show all six at 1280x720, and say how each holds up at 4K and at 720p.
```

---

## 6 · The drawings

```
I need a set of small line drawings for The Killer TV, a social deduction party
game — the art direction is in the style sheet above. They appear on the
television, one at a time, at roughly 200-300px, above a line of text. On the
night screens they're pale line-work on a warm black; from dawn onwards the
background is off-white and they carry colour.

One drawing for each of these moments:

- a village cut off by snow, the road gone
- a lamp in a window, the last one still lit
- somebody pointing in the dark
- two people recognising each other without speaking
- an eye opening
- two coats swapped on their hooks
- a hand taking something that isn't theirs
- a candle just snuffed, smoke still rising
- an empty chair at a full table
- a crowd of raised hands
- a clock running down
- a door closing behind somebody
- a rifle over a mantelpiece
- dawn coming up over roofs
- a chair put back at the table

Same hand throughout — one pen, one weight, no shading, no perspective tricks.
They should look drawn in an evening, not rendered. Nothing gory: this is a
parlour game, and the horror is entirely in what the room says to each other, not
on the screen.

Deliver as SVG, each on its own, with a consistent viewBox so they can be swapped
in and out of the same slot.
```

---

## Bringing it back

Whatever comes out — CSS, SVG, screenshots, a written spec — gets wired into the
site. Prompts 1, 2 and 6 produce assets that drop straight in; 3, 4 and 5 produce
layouts to rebuild against the existing markup.
