/* the killer tv — the drawings.

   Fifteen line drawings, one hand, one pen weight, no shading. Everything
   inherits currentColor, so a drawing is tinted by setting  on its
   container — which is how the same file works on the night face and the day
   face without a second copy.

   There are more places to put a drawing than there are drawings, so several
   are used twice. Two that share a drawing never appear in the same frame. */

const DRAWINGS = {

  a_clock_running_down: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="100" cy="96" r="62"></circle>
      <path d="M100 40v10M100 142v10M44 96h10M146 96h10"></path>
      <path d="M100 96V58M100 96l28 18"></path>
      <circle cx="100" cy="96" r="4" fill="currentColor" stroke="none"></circle>
      <path d="M52 176q48 16 96 0"></path>
      <path d="M148 176l-4-10M148 176l-12 2"></path>
    </g>
</svg>`,

  a_door_closing: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M52 178V34h96v144"></path>
      <path d="M68 178V48h72"></path>
      <path d="M68 106h-6"></path>
      <circle cx="80" cy="112" r="4"></circle>
      <path d="M40 86q-8 14 0 28M28 76q-12 22 0 48"></path>
      <path d="M104 70h24"></path>
    </g>
</svg>`,

  a_hand_taking: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 160h164"></path>
      <path d="M40 104 78 86q12-4 20 6l10 14q4 10-4 18l-28 16q-14 6-24-4l-12-14q-6-10 0-18z"></path>
      <path d="M104 102q22 4 27 26"></path>
      <path d="M98 124q18 4 28 14"></path>
      <path d="M62 138q-4 14 8 18t16-6"></path>
      <path d="M40 104 22 112l10 26 20-2"></path>
      <circle cx="138" cy="136" r="10"></circle>
      <path d="M148 136h26M170 136v8M160 136v6"></path>
    </g>
</svg>`,

  an_eye_opening: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 100q36-46 72-46t72 46q-36 46-72 46t-72-46z"></path>
      <circle cx="100" cy="100" r="20"></circle>
      <circle cx="100" cy="100" r="7" fill="currentColor" stroke="none"></circle>
      <path d="M100 48V32M56 60L46 46M144 60l10-14M32 84L18 76M168 84l14-8"></path>
    </g>
</svg>`,

  candle_just_snuffed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M70 176h60"></path>
      <path d="M100 176v-14"></path>
      <path d="M76 162q24 10 48 0"></path>
      <path d="M84 162V92h32v70"></path>
      <path d="M100 92v-8"></path>
      <path d="M100 84q-16-10-4-24t-2-26 4-16"></path>
    </g>
</svg>`,

  chair_put_back: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 130h168v10H16z"></path>
      <path d="M32 140v36M168 140v36"></path>
      <path d="M32 84q20-14 40 0"></path>
      <path d="M32 84v24M72 84v24"></path>
      <path d="M32 148h40"></path>
      <path d="M80 84q20-14 40 0"></path>
      <path d="M80 84v24M120 84v24"></path>
      <path d="M80 148h40"></path>
      <path d="M128 84q20-14 40 0"></path>
      <path d="M128 84v24M168 84v24"></path>
      <path d="M128 148h40"></path>
      <ellipse cx="52" cy="123" rx="16" ry="6"></ellipse>
      <ellipse cx="100" cy="123" rx="16" ry="6"></ellipse>
      <ellipse cx="148" cy="123" rx="16" ry="6"></ellipse>
    </g>
</svg>`,

  coats_swapped: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 88h152"></path>
      <path d="M62 88v10M138 88v10"></path>
      <path d="M50 168l6-56q0-14 12-14h4l-4 10 8 8 8-8-4-10h4q12 0 12 14l6 56z"></path>
      <path d="M112 168l6-56q0-14 12-14h4l-4 10 8 8 8-8-4-10h4q12 0 12 14l6 56z"></path>
      <path d="M74 62q26-22 52 0" stroke-dasharray="6 8"></path>
      <path d="M74 62l-2-12M74 62l12-4M126 62l2-12M126 62l-12-4"></path>
    </g>
</svg>`,

  dawn_over_roofs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M70 104a30 30 0 0 1 60 0"></path>
      <path d="M100 68V54M64 82l-9-9M136 82l9-9M58 104H44M142 104h14"></path>
      <path d="M18 176v-26l26-24 26 24v26"></path>
      <path d="M70 176v-18l26-22 26 22v18"></path>
      <path d="M122 176v-30l28-26 28 26v30"></path>
      <path d="M34 136v-16M160 132v-16"></path>
      <path d="M14 176h172"></path>
    </g>
</svg>`,

  empty_chair_at_a_full_table: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 130h168v10H16z"></path>
      <path d="M32 140v36M168 140v36"></path>
      <path d="M32 84q20-14 40 0"></path>
      <path d="M32 84v24M72 84v24"></path>
      <path d="M32 148h40"></path>
      <path d="M128 84q20-14 40 0"></path>
      <path d="M128 84v24M168 84v24"></path>
      <path d="M128 148h40"></path>
      <ellipse cx="52" cy="123" rx="16" ry="6"></ellipse>
      <ellipse cx="148" cy="123" rx="16" ry="6"></ellipse>
    </g>
</svg>`,

  lamp_in_a_window: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 172V54h104v118"></path>
      <path d="M40 54l60-26 60 26"></path>
      <path d="M74 148V80h52v68z"></path>
      <path d="M100 80v68M74 114h52"></path>
      <path d="M92 132v-18q0-10 8-10t8 10v18z"></path>
      <path d="M96 104l4-8 4 8"></path>
      <path d="M60 96l-14-6M60 132l-14 6M140 96l14-6M140 132l14 6"></path>
    </g>
</svg>`,

  pointing_in_the_dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M56 100 96 86l66-16q12-3 14 6t-10 12l-52 10q12 12 8 24t-20 16l-36 4q-12 0-12-12z"></path>
      <path d="M88 124q-14 2-18 12t7 10q11 1 17-8"></path>
      <path d="M120 110q5 7 3 14"></path>
      <path d="M56 100 34 106l6 30 24-3"></path>
      <path d="M30 44h10M162 34h12M36 172h12M156 168h10"></path>
    </g>
</svg>`,

  raised_hands: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 178h168"></path>
      <path d="M42 178V142"></path>
      <path d="M30 138V130C18 128 18 114 30 116V110q0 -14 4 -14t4 14q0 -17 4 -17t4 17q0 -13 4 -13t4 13V138q0 6-6 6h-12q-6 0-6-6Z"></path>
      <path d="M74 178V126"></path>
      <path d="M66 122V94q0 -18 4 -18t4 18q0 -14 4 -14t4 14V100C94 98 94 112 82 114V122q0 6-6 6h-4q-6 0-6-6Z"></path>
      <path d="M106 178V148"></path>
      <path d="M94 144V136C82 134 82 120 94 122V116q0 -13 4 -13t4 13q0 -16 4 -16t4 16q0 -13 4 -13t4 13V144q0 6-6 6h-12q-6 0-6-6Z"></path>
      <path d="M138 178V132"></path>
      <path d="M126 128V100q0 -15 4 -15t4 15q0 -18 4 -18t4 18q0 -14 4 -14t4 14V106C162 104 162 118 150 120V128q0 6-6 6h-12q-6 0-6-6Z"></path>
      <path d="M170 178V156"></path>
      <path d="M162 152V144C150 142 150 128 162 130V124q0 -16 4 -16t4 16q0 -13 4 -13t4 13V152q0 6-6 6h-4q-6 0-6-6Z"></path>
    </g>
</svg>`,

  rifle_over_a_mantelpiece: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 128h152"></path>
      <path d="M44 128v34M156 128v34"></path>
      <path d="M30 76h84"></path>
      <path d="M96 76h32v14h-18"></path>
      <path d="M128 76l32 8v14l-30-8z"></path>
      <path d="M110 90q4 12-6 14"></path>
      <path d="M100 90q-8 10 2 14"></path>
      <path d="M30 70v12"></path>
    </g>
</svg>`,

  two_recognising_each_other: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="60" cy="80" r="24"></circle>
      <path d="M26 158q2-52 34-52t34 52"></path>
      <circle cx="140" cy="80" r="24"></circle>
      <path d="M106 158q2-52 34-52t34 52"></path>
      <circle cx="74" cy="78" r="3" fill="currentColor" stroke="none"></circle>
      <circle cx="126" cy="78" r="3" fill="currentColor" stroke="none"></circle>
      <path d="M84 78h32" stroke-dasharray="5 7"></path>
    </g>
</svg>`,

  village_cut_off_by_snow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M50 150V116h38v34"></path><path d="M42 116l27-20 27 20"></path>
      <path d="M108 150v-26h32v26"></path><path d="M102 124l22-16 22 16"></path>
      <path d="M56 106v-16"></path>
      <path d="M78 192l14-30"></path><path d="M124 192l-12-30"></path>
      <path d="M18 154q22-10 44-2t44-2 44 2 32-4"></path>
      <path d="M62 162q22-12 44-2t46-4"></path>
      <circle cx="44" cy="60" r="2.5" fill="currentColor" stroke="none"></circle>
      <circle cx="150" cy="52" r="2.5" fill="currentColor" stroke="none"></circle>
      <circle cx="112" cy="42" r="2.5" fill="currentColor" stroke="none"></circle>
      <circle cx="72" cy="34" r="2.5" fill="currentColor" stroke="none"></circle>
      <circle cx="170" cy="92" r="2.5" fill="currentColor" stroke="none"></circle>
      <circle cx="28" cy="104" r="2.5" fill="currentColor" stroke="none"></circle>
    </g>
</svg>`,
};

/* The names the rest of the app asks for, pointed at the drawing that carries
   the moment. Kept as an alias layer so the drawings can be renamed or
   replaced without touching a single call site. */
const SCENES = {
  /* the story and the rules */
  road:         DRAWINGS.village_cut_off_by_snow,
  village:      DRAWINGS.lamp_in_a_window,
  door:         DRAWINGS.a_door_closing,
  moon:         DRAWINGS.a_clock_running_down,
  knife:        DRAWINGS.pointing_in_the_dark,
  hand:         DRAWINGS.raised_hands,
  sun:          DRAWINGS.dawn_over_roofs,
  smoke:        DRAWINGS.candle_just_snuffed,
  ended:        DRAWINGS.chair_put_back,

  /* the roles */
  killer:       DRAWINGS.pointing_in_the_dark,
  minion:       DRAWINGS.lamp_in_a_window,
  mason:        DRAWINGS.two_recognising_each_other,
  seer:         DRAWINGS.an_eye_opening,
  robber:       DRAWINGS.a_hand_taking,
  troublemaker: DRAWINGS.coats_swapped,
  insomniac:    DRAWINGS.a_clock_running_down,
  doppelganger: DRAWINGS.two_recognising_each_other,
  hunter:       DRAWINGS.rifle_over_a_mantelpiece,
  tanner:       DRAWINGS.empty_chair_at_a_full_table,
  villager:     DRAWINGS.village_cut_off_by_snow,

  /* older names still asked for by lines.js and tv.js */
  eye:          DRAWINGS.an_eye_opening,
  mask:         DRAWINGS.two_recognising_each_other,
  keyhole:      DRAWINGS.lamp_in_a_window,
  rings:        DRAWINGS.two_recognising_each_other,
  key:          DRAWINGS.a_hand_taking,
  swap:         DRAWINGS.coats_swapped,
  candle:       DRAWINGS.a_clock_running_down,
  crown:        DRAWINGS.empty_chair_at_a_full_table,
};

const ROLE_SCENE = {
  killer: 'killer', minion: 'minion', mason: 'mason', seer: 'seer',
  robber: 'robber', troublemaker: 'troublemaker', insomniac: 'insomniac',
  doppelganger: 'doppelganger', hunter: 'hunter', tanner: 'tanner',
  villager: 'villager',
};

const sceneFor = (id) => SCENES[id] || '';
