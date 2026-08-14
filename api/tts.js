/* Text to speech, proxied. The API key stays here in a Vercel environment
 * variable and is never sent to the browser — players get audio bytes only.
 *
 * Two backends, because there are two different Google keys in the world and
 * they are not interchangeable:
 *
 *   gemini  — an AI Studio key from aistudio.google.com. Calls the Gemini TTS
 *             model. Returns raw PCM, which we wrap in a WAV header here.
 *   cloud   — a Google Cloud console key with the Cloud Text-to-Speech API
 *             enabled. Returns MP3.
 *
 * An AI Studio key sent to Cloud TTS fails with API_KEY_INVALID, which is the
 * single most common way to get this wrong. So the default backend is "auto":
 * try Gemini, and if the key isn't valid there, try Cloud instead. Whichever
 * works gets remembered for the life of the serverless instance.
 *
 * Env vars:
 *   GOOGLE_TTS_KEY   required — either kind of key
 *   TTS_BACKEND      auto (default) | gemini | cloud
 *   TTS_VOICE        gemini default Charon; cloud default en-GB-Chirp3-HD-Charon
 *   TTS_STYLE        gemini only — the delivery note prepended to each line
 *   TTS_RATE         cloud only, default 0.88
 *   TTS_PITCH        cloud only, default -4.0 (ignored by Chirp3-HD voices)
 *
 * With no key at all this reports { ok: false } and the game falls back to the
 * browser's own voice. Nothing breaks; it just sounds cheaper.
 */

/* Vercel stores the value verbatim, so a key pasted with surrounding quotes or a
   stray newline arrives with them attached and Google rejects it as invalid.
   GEMINI_API_KEY is what Google's own samples call it, so accept either name. */
const KEY = (process.env.GOOGLE_TTS_KEY || process.env.GEMINI_API_KEY || '')
  .trim().replace(/^["']|["']$/g, '');
const BACKEND = (process.env.TTS_BACKEND || 'auto').toLowerCase();
const RATE = Number(process.env.TTS_RATE || 0.88);
const PITCH = Number(process.env.TTS_PITCH || -4.0);

const GEMINI_MODEL = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const GEMINI_VOICE = process.env.TTS_VOICE || 'Charon';
const CLOUD_VOICE = process.env.TTS_VOICE || 'en-GB-Chirp3-HD-Charon';
const STYLE = process.env.TTS_STYLE ||
  'Read this as a British narrator for a horror party game. Deep, low and unhurried. ' +
  'Grim but matter-of-fact, never shouting and never whispering:';

/* which backend actually worked, remembered per warm instance */
let proven = BACKEND === 'auto' ? null : BACKEND;

/* ---- PCM from Gemini needs a WAV wrapper before a browser will touch it ---- */
function toWav(pcm, sampleRate) {
  const channels = 1, bits = 16;
  const blockAlign = channels * (bits / 8);
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + pcm.length, 4);
  head.write('WAVE', 8);
  head.write('fmt ', 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(channels, 22);
  head.writeUInt32LE(sampleRate, 24);
  head.writeUInt32LE(sampleRate * blockAlign, 28);
  head.writeUInt16LE(blockAlign, 32);
  head.writeUInt16LE(bits, 34);
  head.write('data', 36);
  head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

async function viaGemini(text) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(GEMINI_MODEL) + ':generateContent?key=' + encodeURIComponent(KEY);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: STYLE + '\n\n' + text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } },
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(detail.slice(0, 400));
    err.status = res.status;
    err.badKey = /API_KEY_INVALID|API key not valid/i.test(detail);
    throw err;
  }

  const json = await res.json();
  const part = json.candidates && json.candidates[0] && json.candidates[0].content &&
    json.candidates[0].content.parts && json.candidates[0].content.parts[0];
  const inline = part && part.inlineData;
  if (!inline || !inline.data) throw new Error('gemini returned no audio');

  const mime = inline.mimeType || '';
  const rate = Number((mime.match(/rate=(\d+)/) || [])[1] || 24000);
  return { body: toWav(Buffer.from(inline.data, 'base64'), rate), type: 'audio/wav' };
}

async function viaCloud(text) {
  const audioConfig = { audioEncoding: 'MP3', speakingRate: RATE };
  if (!/chirp/i.test(CLOUD_VOICE)) audioConfig.pitch = PITCH;

  const res = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(KEY),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: CLOUD_VOICE.slice(0, 5), name: CLOUD_VOICE },
        audioConfig,
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(detail.slice(0, 400));
    err.status = res.status;
    err.badKey = /API_KEY_INVALID|API key not valid/i.test(detail);
    throw err;
  }

  const json = await res.json();
  if (!json.audioContent) throw new Error('cloud returned no audio');
  return { body: Buffer.from(json.audioContent, 'base64'), type: 'audio/mpeg' };
}

async function synth(text) {
  const order = proven ? [proven]
    : BACKEND === 'auto' ? ['gemini', 'cloud']
    : [BACKEND];

  let last = null;
  for (const name of order) {
    try {
      const out = await (name === 'gemini' ? viaGemini(text) : viaCloud(text));
      proven = name;
      out.backend = name;
      return out;
    } catch (err) {
      last = err;
      // only worth trying the other backend if the key was rejected outright
      if (!err.badKey) break;
    }
  }
  throw last || new Error('no backend available');
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: !!KEY,
      backend: proven || BACKEND,
      voice: proven === 'cloud' ? CLOUD_VOICE : GEMINI_VOICE,
      // enough to spot a truncated or mangled paste without leaking the key
      keyLength: KEY.length,
      keyLooksRight: /^AIza[\w-]{30,}$/.test(KEY),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!KEY) return res.status(503).json({ error: 'GOOGLE_TTS_KEY is not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const text = String((body && body.text) || '').slice(0, 900).trim();
  if (!text) return res.status(400).json({ error: 'no text' });

  try {
    const out = await synth(text);
    res.setHeader('Content-Type', out.type);
    res.setHeader('Content-Length', String(out.body.length));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-TTS-Backend', out.backend);
    return res.status(200).send(out.body);
  } catch (err) {
    return res.status(502).json({
      error: 'text to speech failed',
      hint: err.badKey
        ? 'That key was rejected by both Google speech APIs. An AI Studio key needs TTS_BACKEND=gemini; ' +
          'a Cloud console key needs the Cloud Text-to-Speech API enabled on the same project.'
        : undefined,
      status: err.status,
      detail: String(err.message).slice(0, 400),
    });
  }
};
