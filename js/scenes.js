/* the killer tv — the pictures.

   Solid silhouettes with heavy strokes, not thin line art. These get scaled to
   about a third of a television and looked at from a sofa, so hairlines vanish
   and anything fiddly turns to mush. Shapes read; detail doesn't.

   Everything inherits currentColor so the TV can tint a scene by mood. Holes
   (windows, eye sockets) are cut with fill-rule="evenodd" rather than painted
   in a background colour, so they work on any backdrop. */

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" fill="none" ' +
  'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">';

const SCENES = {

  /* a row of houses with the lights still on */
  village: SVG_OPEN + `
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M8 122V80l22-18 22 18v42Z   M22 92h14v14H22Z
      M62 122V70l28-22 28 22v52Z  M80 86h20v18H80Z
      M128 122V78l22-18 22 18v44Z M142 92h14v12h-14Z
      M182 122V74l25-20 25 20v48Z M198 88h18v16h-18Z"/>
    <path d="M0 122h240"/>
  </svg>`,

  /* same street, lights out, moon up */
  night: SVG_OPEN + `
    <path fill="currentColor" stroke="none" d="M176 16a27 27 0 1 0 25 37 29 29 0 0 1-25-37Z"/>
    <circle cx="44" cy="26" r="2.4" fill="currentColor" stroke="none"/>
    <circle cx="86" cy="46" r="1.8" fill="currentColor" stroke="none"/>
    <circle cx="28" cy="62" r="1.8" fill="currentColor" stroke="none"/>
    <circle cx="112" cy="22" r="2.2" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="
      M4 124V92l20-16 20 16v32Z
      M58 124V84l24-19 24 19v40Z
      M120 124V90l20-16 20 16v34Z
      M182 124V86l23-18 23 18v38Z"/>
    <path d="M0 124h240"/>
  </svg>`,

  /* a door standing open with the light coming out of it */
  door: SVG_OPEN + `
    <path fill="currentColor" stroke="none" d="M76 22h56v100H76Z"/>
    <path d="M132 22 176 34v76l-44 12Z"/>
    <circle cx="142" cy="72" r="3.4" fill="currentColor" stroke="none"/>
    <path d="M54 122h150"/>
    <path d="M40 44 62 56M34 72h26M40 100l22-12" stroke-dasharray="5 7"/>
  </svg>`,

  /* under a sheet: two mounds read as a body, one mound reads as a rock */
  body: SVG_OPEN + `
    <path d="M14 124h212"/>
    <path fill="currentColor" stroke="none" d="M44 124c0-25 24-40 60-40s58 15 58 40Z"/>
    <path fill="currentColor" stroke="none" d="M148 124c0-17 11-28 25-28s25 11 25 28Z"/>
    <path fill="currentColor" stroke="none" d="M56 100 34 120l9 7 20-20Z"/>
  </svg>`,

  /* a face with nothing behind it */
  mask: SVG_OPEN + `
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M120 14c-25 0-41 19-41 49 0 31 18 59 41 59s41-28 41-59c0-30-16-49-41-49Z
      M95 60a9 7 0 1 0 18 0 9 7 0 1 0-18 0Z
      M127 60a9 7 0 1 0 18 0 9 7 0 1 0-18 0Z
      M108 92h24v7h-24Z"/>
    <path d="M176 32c11 11 17 28 17 49s-6 38-17 49" stroke-dasharray="5 8"/>
    <path d="M204 22c15 15 23 36 23 59s-8 44-23 59" stroke-dasharray="5 8"/>
  </svg>`,

  /* whoever it is, standing where they shouldn't be. The blade sits clear of
     the coat with daylight between them, or the two shapes merge into a blob. */
  killer: SVG_OPEN + `
    <circle cx="104" cy="32" r="15" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M104 49c-14 0-24 7-27 17l-11 56h76l-11-56c-3-10-13-17-27-17Z"/>
    <path fill="currentColor" stroke="none" d="M130 72l28-7 2 9-29 7Z"/>
    <path fill="currentColor" stroke="none" d="M166 64h10v42l-5 16-5-16Z"/>
    <path d="M0 126h240"/>
  </svg>`,

  /* the one who looks */
  eye: SVG_OPEN + `
    <path d="M50 70c26-31 43-45 70-45s44 14 70 45c-26 31-43 45-70 45s-44-14-70-45Z"/>
    <circle cx="120" cy="70" r="21"/>
    <circle cx="120" cy="70" r="9" fill="currentColor" stroke="none"/>
    <path d="M120 12V2M166 24l7-10M74 24l-7-10M198 58l11-5M42 58l-11-5"/>
    <path d="M120 128v10M170 116l7 10M70 116l-7 10"/>
  </svg>`,

  /* watching from between the curtains */
  watcher: SVG_OPEN + `
    <path stroke-width="4" d="M74 6v128M166 6v128"/>
    <path d="M92 70c11-15 18-21 28-21s17 6 28 21c-11 15-18 21-28 21s-17-6-28-21Z"/>
    <circle cx="120" cy="70" r="10"/>
    <circle cx="120" cy="70" r="4.5" fill="currentColor" stroke="none"/>
  </svg>`,

  /* two who know each other on sight */
  hands: SVG_OPEN + `
    <circle cx="76" cy="52" r="17" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M46 124c0-19 13-32 30-32s30 13 30 32Z"/>
    <circle cx="164" cy="52" r="17" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M134 124c0-19 13-32 30-32s30 13 30 32Z"/>
    <path d="M100 50h40" stroke-dasharray="5 7"/>
  </svg>`,

  /* took what wasn't theirs */
  key: SVG_OPEN + `
    <circle cx="74" cy="70" r="28"/>
    <circle cx="74" cy="70" r="11" fill="currentColor" stroke="none"/>
    <path stroke-width="4" d="M102 70h88"/>
    <path stroke-width="4" d="M152 70v22M172 70v28M190 70v16"/>
  </svg>`,

  /* two people, quietly exchanged */
  swap: SVG_OPEN + `
    <circle cx="44" cy="48" r="15" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M18 124c0-17 12-28 26-28s26 11 26 28Z"/>
    <circle cx="196" cy="48" r="15" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M170 124c0-17 12-28 26-28s26 11 26 28Z"/>
    <path d="M86 52h68l-14-13"/>
    <path d="M154 82H86l14 13"/>
  </svg>`,

  /* the window that never goes dark */
  lamp: SVG_OPEN + `
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M82 32h76v78H82Z
      M117 32h6v78h-6Z
      M82 68h76v6H82Z"/>
    <path d="M70 118h100M76 128h88"/>
    <path d="M166 40l22-10M166 68h26M166 96l22 10" stroke-dasharray="5 7"/>
    <path d="M74 40 52 30M74 68H48M74 96l-22 10" stroke-dasharray="5 7"/>
  </svg>`,

  /* the rope */
  vote: SVG_OPEN + `
    <path stroke-width="4" d="M120 4v44"/>
    <path fill="currentColor" stroke="none" d="M110 48h20l-4 14h-12Z"/>
    <ellipse cx="120" cy="92" rx="24" ry="32" stroke-width="4"/>
    <path d="M28 8h184" stroke-width="4"/>
  </svg>`,

  /* one shot left */
  hunter: SVG_OPEN + `
    <path stroke-width="4" d="M74 16c28 24 28 84 0 108"/>
    <path d="M74 16 64 70l10 54"/>
    <path stroke-width="4" d="M64 70h108"/>
    <path fill="currentColor" stroke="none" d="M196 70l-26-10v20Z"/>
    <path d="M64 70l-11-7M64 70l-11 7"/>
  </svg>`,

  /* morning */
  dawn: SVG_OPEN + `
    <path d="M0 104h240"/>
    <path fill="currentColor" stroke="none" d="M76 104a44 44 0 0 1 88 0Z"/>
    <path d="M120 42V20M164 60l16-16M76 60 60 44M188 100h20M32 100h20"/>
    <path d="M14 118h44M78 118h36M136 118h50M200 118h26"/>
  </svg>`,

  /* nobody left to stop them: the street gone dark, the figure still standing */
  killer_win: SVG_OPEN + `
    <path d="M0 126h240"/>
    <path d="M10 126V98l17-14 17 14v28M52 126V92l19-15 19 15v34" stroke-dasharray="5 7"/>
    <path d="M152 126V92l19-15 19 15v34M196 126V98l17-14 17 14v28" stroke-dasharray="5 7"/>
    <circle cx="104" cy="30" r="15" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none" d="M104 47c-14 0-24 7-27 17l-11 62h76l-11-62c-3-10-13-17-27-17Z"/>
    <path fill="currentColor" stroke="none" d="M130 70l28-7 2 9-29 7Z"/>
    <path fill="currentColor" stroke="none" d="M166 62h10v46l-5 16-5-16Z"/>
  </svg>`,

  /* the lights come back on */
  village_win: SVG_OPEN + `
    <path d="M0 122h240"/>
    <path fill="currentColor" stroke="none" d="M92 58a28 28 0 0 1 56 0Z"/>
    <path d="M120 26V10M158 38l12-12M82 38 70 26M182 56h18M40 56h18"/>
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M18 122V90l20-16 20 16v32Z  M30 100h16v14H30Z
      M92 122V86l28-22 28 22v36Z  M110 98h20v16h-20Z
      M182 122V90l20-16 20 16v32Z M194 100h16v14h-16Z"/>
  </svg>`,

  /* got exactly what they wanted */
  tanner_win: SVG_OPEN + `
    <path fill="currentColor" stroke="none" fill-rule="evenodd" d="
      M120 8c-36 0-64 27-64 63 0 20 9 37 24 48v13h80v-13c15-11 24-28 24-48 0-36-28-63-64-63Z
      M84 62a15 15 0 1 0 30 0 15 15 0 1 0-30 0Z
      M126 62a15 15 0 1 0 30 0 15 15 0 1 0-30 0Z
      M112 88h16l-8 16Z
      M96 108h6v24h-6Z M114 108h6v24h-6Z M132 108h6v24h-6Z"/>
  </svg>`,
};

function sceneFor(id) {
  return SCENES[id] || SCENES.night;
}
