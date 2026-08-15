/* the killer tv — the drawings.

   One square viewBox for everything, one stroke weight, no fills except where a
   solid shape reads better than an outline. They sit above the type at about a
   fifth of the screen and are looked at from a sofa, so anything fiddly turns to
   mush. Shapes read; detail does not.

   Everything inherits currentColor, so a scene is tinted by setting `color` on
   its container. */

const S_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" ' +
  'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">';

const SCENES = {

  /* ---- the story ---- */

  road: S_OPEN + `
    <path d="M6 112h108"/>
    <path d="M44 112 54 34M76 112 66 34"/>
    <path d="M60 100v-9M60 79v-9M60 58v-8M60 40v-6"/>
    <path fill="currentColor" stroke="none" d="M18 112c0-9 6-15 14-15s14 6 14 15Z"/>
    <path fill="currentColor" stroke="none" d="M74 112c0-9 6-15 14-15s14 6 14 15Z"/>
    <path d="M30 34h60" stroke-dasharray="0 9" stroke-width="4"/>
  </svg>`,

  village: S_OPEN + `
    <path d="M4 108h112"/>
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M12 108V76l16-13 16 13v32Z  M22 84h12v12H22Z
      M50 108V64l20-16 20 16v44Z  M62 76h16v14H62Z
      M96 108V78l14-11 14 11v30Z  M104 86h10v10h-10Z"/>
    <path d="M70 48V30h-8"/>
  </svg>`,

  door: S_OPEN + `
    <path d="M18 110h84"/>
    <path fill="currentColor" stroke="none" d="M34 14h30v96H34Z"/>
    <path d="M64 14 92 24v76l-28 10Z"/>
    <circle cx="72" cy="64" r="3" fill="currentColor" stroke="none"/>
    <path d="M14 34 26 42M10 62h14M14 92l12-8" stroke-dasharray="5 7"/>
  </svg>`,

  moon: S_OPEN + `
    <path fill="currentColor" stroke="none" d="M74 16a34 34 0 1 0 30 46 36 36 0 0 1-30-46Z"/>
    <circle cx="24" cy="30" r="3" fill="currentColor" stroke="none"/>
    <circle cx="38" cy="60" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="18" cy="76" r="2.2" fill="currentColor" stroke="none"/>
    <path d="M4 108h112"/>
  </svg>`,

  /* ---- the rules ---- */

  knife: S_OPEN + `
    <path fill="currentColor" stroke="none" d="M52 10h14v52H52Z"/>
    <path fill="currentColor" stroke="none" d="M44 62h30v9H44Z"/>
    <path fill="currentColor" stroke="none" d="M50 71h18l-9 42Z"/>
  </svg>`,

  hand: S_OPEN + `
    <path fill="currentColor" stroke="none" d="
      M54 14a7 7 0 0 1 14 0v46h4V34a7 7 0 0 1 14 0v40
      c0 22-12 34-30 34S26 96 26 74V56a7 7 0 0 1 14 0v14h4V22a7 7 0 0 1 10-8Z"/>
  </svg>`,

  sun: S_OPEN + `
    <circle cx="60" cy="60" r="24" fill="currentColor" stroke="none"/>
    <path d="M60 16V4M60 116v-12M104 60h12M4 60h12M91 29l9-9M20 100l9-9M91 91l9 9M20 20l9 9"/>
  </svg>`,

  /* ---- the roles that wake ---- */

  eye: S_OPEN + `
    <path d="M10 60c18-24 32-35 50-35s32 11 50 35c-18 24-32 35-50 35s-32-11-50-35Z"/>
    <circle cx="60" cy="60" r="15"/>
    <circle cx="60" cy="60" r="6" fill="currentColor" stroke="none"/>
  </svg>`,

  mask: S_OPEN + `
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M60 10c-20 0-32 15-32 39 0 25 14 47 32 47s32-22 32-47c0-24-12-39-32-39Z
      M40 48a8 6 0 1 0 16 0 8 6 0 1 0-16 0Z
      M64 48a8 6 0 1 0 16 0 8 6 0 1 0-16 0Z
      M50 72h20v6H50Z"/>
    <path d="M100 30c7 9 11 20 11 32s-4 23-11 32" stroke-dasharray="4 7"/>
  </svg>`,

  keyhole: S_OPEN + `
    <path d="M22 10h76v100H22Z"/>
    <circle cx="60" cy="50" r="13" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M52 60h16l5 30H47Z"/>
  </svg>`,

  rings: S_OPEN + `
    <circle cx="44" cy="60" r="26"/>
    <circle cx="76" cy="60" r="26"/>
  </svg>`,

  key: S_OPEN + `
    <circle cx="34" cy="46" r="18"/>
    <circle cx="34" cy="46" r="6" fill="currentColor" stroke="none"/>
    <path d="M46 58 96 108"/>
    <path d="M78 90 90 78M88 100l10-10"/>
  </svg>`,

  swap: S_OPEN + `
    <path d="M18 44h84l-18-18"/>
    <path d="M102 76H18l18 18"/>
  </svg>`,

  candle: S_OPEN + `
    <path fill="currentColor" stroke="none" d="M46 46h28v58H46Z"/>
    <path d="M32 110h56"/>
    <path d="M60 46V34"/>
    <path fill="currentColor" stroke="none" d="M60 8c9 9 13 16 13 22a13 13 0 0 1-26 0c0-6 4-13 13-22Z"/>
  </svg>`,

  /* ---- what happens ---- */

  body: S_OPEN + `
    <path d="M8 106h104"/>
    <path fill="currentColor" stroke="none" d="M22 106c0-24 18-36 32-36s32 12 32 36Z"/>
    <path fill="currentColor" stroke="none" d="M92 90h12v16H92Z"/>
    <path fill="currentColor" stroke="none" d="M76 90h12v16H76Z"/>
  </svg>`,

  smoke: S_OPEN + `
    <path fill="currentColor" stroke="none" d="M46 54h28v50H46Z"/>
    <path d="M32 110h56"/>
    <path d="M60 54V42"/>
    <path d="M60 36c8-4 8-12 0-16s-8-12 0-16" stroke-dasharray="5 6"/>
  </svg>`,

  crown: S_OPEN + `
    <path fill="currentColor" stroke="none" d="M18 92 10 38l24 18 26-32 26 32 24-18-8 54Z"/>
    <path d="M18 104h84"/>
  </svg>`,
};

function sceneFor(id) { return SCENES[id] || SCENES.moon; }

/* Which drawing goes with each role when it is called at night. */
const ROLE_SCENE = {
  killer: 'knife',
  minion: 'keyhole',
  mason: 'rings',
  seer: 'eye',
  robber: 'key',
  troublemaker: 'swap',
  insomniac: 'candle',
  doppelganger: 'mask',
  hunter: 'knife',
  tanner: 'crown',
  villager: 'village',
};
