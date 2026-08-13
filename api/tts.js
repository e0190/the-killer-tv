/* Google Cloud Text-to-Speech, proxied.
 *
 * The API key stays here, in a Vercel environment variable. It is never sent
 * to the browser — players only ever receive MP3 bytes.
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   GOOGLE_TTS_KEY   required. A Google Cloud API key with the
 *                    Cloud Text-to-Speech API enabled.
 *   TTS_VOICE        optional. Default en-GB-Chirp3-HD-Charon (deep British male).
 *                    Other good ones: en-GB-Studio-B, en-GB-Neural2-D.
 *   TTS_LANG         optional. Default en-GB.
 *   TTS_RATE         optional. Default 0.88 — a touch slower than natural.
 *   TTS_PITCH        optional. Default -4.0 semitones, so it sits low.
 *                    Ignored for Chirp3-HD voices, which don't accept a pitch.
 *
 * With no key set this reports { ok: false } and the game falls back to the
 * browser's own speech engine. Nothing breaks; it just sounds cheaper.
 */

const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

const KEY = process.env.GOOGLE_TTS_KEY || '';
const VOICE = process.env.TTS_VOICE || 'en-GB-Chirp3-HD-Charon';
const LANG = process.env.TTS_LANG || 'en-GB';
const RATE = Number(process.env.TTS_RATE || 0.88);
const PITCH = Number(process.env.TTS_PITCH || -4.0);

module.exports = async function handler(req, res) {
  // Probe: the client asks whether the good voice is available at all.
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: !!KEY, voice: KEY ? VOICE : null });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!KEY) {
    return res.status(503).json({ error: 'GOOGLE_TTS_KEY is not set' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const text = String((body && body.text) || '').slice(0, 600).trim();
  if (!text) return res.status(400).json({ error: 'no text' });

  const audioConfig = { audioEncoding: 'MP3', speakingRate: RATE };
  // Chirp3-HD is the most natural family but rejects a pitch offset.
  if (!/chirp/i.test(VOICE)) audioConfig.pitch = PITCH;

  try {
    const upstream = await fetch(ENDPOINT + '?key=' + encodeURIComponent(KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANG, name: VOICE },
        audioConfig,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(502).json({
        error: 'google tts rejected the request',
        status: upstream.status,
        detail: detail.slice(0, 400),
      });
    }

    const data = await upstream.json();
    if (!data.audioContent) return res.status(502).json({ error: 'no audio came back' });

    const audio = Buffer.from(data.audioContent, 'base64');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(audio.length));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(audio);
  } catch (err) {
    return res.status(502).json({ error: 'tts request failed', detail: String(err).slice(0, 200) });
  }
};
