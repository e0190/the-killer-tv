/* the killer tv — the pictures.
   Line art, one stroke weight, no fills except where it reads as shadow.
   Everything inherits currentColor so the TV can tint a scene by mood. */

const SCENES = {

  night: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M158 30a24 24 0 1 0 22 33 26 26 0 0 1-22-33Z"/>
    <circle cx="46" cy="26" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="78" cy="44" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="30" cy="58" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="104" cy="24" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="200" cy="86" r="1.1" fill="currentColor" stroke="none"/>
    <path d="M0 116h240"/>
    <path d="M22 116V96l-9 4 9-16 9 16-9-4M52 116V88l-11 5 11-20 11 20-11-5"/>
    <path d="M188 116V94l-8 4 8-14 8 14-8-4M214 116V100l-7 3 7-12 7 12-7-3"/>
    <path d="M92 116v-14h34v14M100 102V94h18v8M106 110h6"/>
  </svg>`,

  wolf: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M78 44 68 18l22 12a44 44 0 0 1 40 0l22-12-10 26"/>
    <path d="M78 44c-6 14-6 30 2 42l18 26c4 6 10 9 22 9s18-3 22-9l18-26c8-12 8-28 2-42"/>
    <path d="M120 88v14M108 104h24"/>
    <path d="M92 66h16M132 66h16"/>
    <path d="M104 108l6 8M136 108l-6 8"/>
    <path d="M28 128l14-8M212 128l-14-8M18 104l16-3M222 104l-16-3"/>
  </svg>`,

  eye: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 70c26-30 42-44 68-44s42 14 68 44c-26 30-42 44-68 44s-42-14-68-44Z"/>
    <circle cx="120" cy="70" r="20"/>
    <circle cx="120" cy="70" r="7" fill="currentColor" stroke="none"/>
    <path d="M120 12V2M164 24l6-9M76 24l-6-9M196 60l10-4M44 60l-10-4"/>
    <path d="M120 128v10M168 118l6 9M72 118l-6 9"/>
  </svg>`,

  mask: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M88 16c-14 8-20 24-20 46 0 30 14 62 32 62s32-32 32-62c0-22-6-38-20-46Z"/>
    <path d="M120 16c14 8 20 24 20 46 0 30-14 62-32 62"/>
    <ellipse cx="90" cy="58" rx="9" ry="6"/>
    <ellipse cx="122" cy="58" rx="9" ry="6"/>
    <path d="M96 92c8 4 14 4 22 0"/>
    <path d="M168 30c12 10 18 26 18 48s-6 40-18 50" stroke-dasharray="4 7"/>
    <path d="M196 22c16 14 24 34 24 60s-8 46-24 60" stroke-dasharray="4 7"/>
  </svg>`,

  watcher: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 124h240"/>
    <path d="M40 124V80l-14 6 14-24 14 24-14-6M74 124V70l-16 7 16-28 16 28-16-7"/>
    <path d="M166 124V70l-16 7 16-28 16 28-16-7M200 124V80l-14 6 14-24 14 24-14-6"/>
    <path d="M120 124v-30M110 94a10 10 0 0 1 20 0"/>
    <circle cx="120" cy="76" r="9"/>
    <circle cx="117" cy="76" r="2" fill="currentColor" stroke="none"/>
    <path d="M104 40h32M108 30h24" stroke-dasharray="3 6"/>
  </svg>`,

  hands: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M60 118V64a26 26 0 0 1 52 0v54"/>
    <path d="M128 118V64a26 26 0 0 1 52 0v54"/>
    <path d="M60 90h52M128 90h52"/>
    <path d="M86 64V38M154 64V38"/>
    <path d="M74 26h24l-12-14ZM142 26h24l-12-14Z"/>
    <path d="M40 118h160"/>
    <path d="M112 100h16" stroke-dasharray="3 5"/>
  </svg>`,

  key: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="76" cy="70" r="26"/>
    <circle cx="76" cy="70" r="10"/>
    <path d="M102 70h84"/>
    <path d="M150 70v20M168 70v26M186 70v14"/>
    <path d="M198 34c8 10 12 22 12 36s-4 26-12 36" stroke-dasharray="4 7"/>
    <path d="M30 34c-8 10-12 22-12 36s4 26 12 36" stroke-dasharray="4 7"/>
  </svg>`,

  swap: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="30" y="76" width="46" height="46" rx="4"/>
    <rect x="164" y="76" width="46" height="46" rx="4"/>
    <circle cx="53" cy="52" r="14"/>
    <circle cx="187" cy="52" r="14"/>
    <path d="M84 34h72l-14-12M156 62H84l14 12"/>
  </svg>`,

  lamp: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="82" y="30" width="76" height="76" rx="2"/>
    <path d="M120 30v76M82 68h76"/>
    <path d="M72 106h96M76 118h88"/>
    <path d="M158 44l24-10M158 60h26M158 78l24 10" stroke-dasharray="3 6"/>
    <path d="M82 44 58 34M82 60H56M82 78l-24 10" stroke-dasharray="3 6"/>
    <path d="M104 88h32v18h-32z"/>
  </svg>`,

  dawn: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 104h240"/>
    <path d="M78 104a42 42 0 0 1 84 0"/>
    <path d="M120 44V22M162 62l16-16M78 62 62 46M186 100h20M34 100h20"/>
    <path d="M14 118h44M78 118h36M136 118h50M200 118h26" stroke-dasharray="none" opacity=".5"/>
  </svg>`,

  body: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 112h176"/>
    <path d="M54 112c0-10 8-16 20-16h92c12 0 20 6 20 16"/>
    <path d="M74 96c-4-14 2-22 16-24l58-8c14-2 22 4 22 16"/>
    <path d="M92 74c0-8 6-14 14-14s14 6 14 14"/>
    <path d="M170 96v16M150 98v14M128 100v12"/>
    <path d="M40 46l10 10M50 46 40 56M196 40l10 10M206 40l-10 10"/>
  </svg>`,

  vote: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M120 22v54"/>
    <circle cx="120" cy="86" r="14"/>
    <path d="M120 100v18"/>
    <path d="M46 118c0-12 8-20 18-24l14-6M194 118c0-12-8-20-18-24l-14-6"/>
    <path d="M78 88l16-8 8 10M162 88l-16-8-8 10"/>
    <path d="M62 40h20M158 40h20" stroke-dasharray="3 6"/>
  </svg>`,

  wolves_win: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M156 26a22 22 0 1 0 20 30 24 24 0 0 1-20-30Z"/>
    <path d="M60 122V86l-14-8 12-30 22 12 20-8 20 8 22-12 12 30-14 8v36Z"/>
    <path d="M84 96h12M124 96h12"/>
    <path d="M96 112h28M104 118l6-6M116 118l-6-6"/>
  </svg>`,

  village_win: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 118h240"/>
    <path d="M96 60a24 24 0 0 1 48 0"/>
    <path d="M120 30V14M154 42l12-12M86 42 74 30"/>
    <path d="M30 118V88l20-16 20 16v30M42 118v-14h16v14"/>
    <path d="M170 118V88l20-16 20 16v30M182 118v-14h16v14"/>
    <path d="M100 118V96h40v22M114 118v-12h12v12"/>
  </svg>`,

  tanner_win: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M84 116v-14c-16-8-26-24-26-42a62 62 0 0 1 124 0c0 18-10 34-26 42v14Z"/>
    <circle cx="98" cy="58" r="11"/>
    <circle cx="142" cy="58" r="11"/>
    <path d="M114 80h12l-6 12Z"/>
    <path d="M98 102h44M106 102v14M120 102v14M134 102v14"/>
  </svg>`,

  hunter: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M74 20c26 16 26 84 0 100"/>
    <path d="M74 20 68 70l6 50"/>
    <path d="M68 70h108"/>
    <path d="M176 70l-16-10M176 70l-16 10"/>
    <path d="M196 52c8 6 12 12 12 18s-4 12-12 18" stroke-dasharray="4 7"/>
  </svg>`,
};

function sceneFor(id) {
  return SCENES[id] || SCENES.night;
}
