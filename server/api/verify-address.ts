import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required.' });
    }

    // Dummy check or real API integration here:
    // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    //   params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
    // });

    // Mock response for now
    return res.json({ valid: true, normalizedAddress: address });

  } catch (error) {
    console.error('Error verifying address:', error);
    return res.status(500).json({ error: 'Failed to verify address' });
  }
});

export default router;
