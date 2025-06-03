
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/search', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    const zipComponent = geoData.results[0]?.address_components.find(c => c.types.includes('postal_code'));
    const cityComponent = geoData.results[0]?.address_components.find(c => c.types.includes('locality'));
    const stateComponent = geoData.results[0]?.address_components.find(c => c.types.includes('administrative_area_level_1'));

    const zip = zipComponent?.long_name;
    const city = cityComponent?.long_name;
    const state = stateComponent?.long_name;

    if (!zip || !city || !state) {
      return res.status(404).json({ error: 'Could not determine location details' });
    }

    console.log(`📫 Resolved ZIP: ${zip} (${city}, ${state})`);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            {
  role: 'user',
  content: `
  Respond ONLY in this exact JSON format:

  {
    "Electricity": { "provider": "Company", "phone": "123-456-7890" },
    "Gas": { "provider": "Company", "phone": "123-456-7890" },
    "Water": { "provider": "Company", "phone": "123-456-7890" },
    "Internet": { "provider": "Company", "phone": "123-456-7890" },
    "Trash": { "provider": "Company", "phone": "123-456-7890" }
  }

  For ZIP code ${zip} (${city}, ${state}). Do not include text, markdown, or formatting — just valid JSON. Do not say "Here is the JSON" or use backticks.
  `.trim()
}
        ],
        temperature: 0.2
      })
    });

    const gptData = await openaiRes.json();
    const gptText = gptData.choices?.[0]?.message?.content || 'No response from GPT';

    return res.json({
      zip,
      city,
      state,
      gptResponse: gptText
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
