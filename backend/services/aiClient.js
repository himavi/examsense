// Groq retires models over time; override with GROQ_MODEL instead of editing code.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

export async function callAI(prompt) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        reasoning_effort: 'low',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (err) {
    throw new Error(`AI call failed: ${err.message}`);
  }
}
