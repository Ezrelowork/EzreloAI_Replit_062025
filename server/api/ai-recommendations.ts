import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is in your .env
});

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content;

    return res.json({ result: message });
  } catch (error) {
    console.error('AI generation failed:', error);
    return res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

export default router;