// Vercel Serverless Function
// 이 파일은 서버에서만 실행됩니다. GEMINI_API_KEY는 Vercel 프로젝트의
// Environment Variables에 저장되며, 이 코드나 브라우저에는 절대 노출되지 않습니다.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '서버에 GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt가 필요합니다.' });
  }

  const GEMINI_MODEL = 'gemini-3.5-flash';
  const TAG_OPTIONS = ["식당", "이동", "쇼핑", "숙소", "일상", "감정"];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                english: { type: 'STRING' },
                vocab_word: { type: 'STRING' },
                vocab_meaning: { type: 'STRING' },
                tip: { type: 'STRING' },
                tag: { type: 'STRING', enum: TAG_OPTIONS }
              },
              required: ['english', 'vocab_word', 'vocab_meaning', 'tip', 'tag']
            }
          }
        })
      }
    );

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Gemini 호출 중 오류가 발생했습니다.' });
  }
}
