export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { prompt } = body
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set in environment variables' }), { status: 500 })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a sharp business analyst for a Nigerian bread and doughnut delivery bakery. 
Provide concise, practical, actionable insights in plain English. 
Use bullet points (•) for clarity. 
Keep responses under 350 words. 
Always reference specific customer names or amounts where available.
Use Nigerian Naira (₦) for amounts.`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq error:', errText)
      return new Response(JSON.stringify({ error: `Groq API error: ${response.status}` }), { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content returned from Groq' }), { status: 502 })
    }

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Handler error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
