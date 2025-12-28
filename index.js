const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: [
    'https://matoka1.github.io',
    'http://localhost:3000',
    'http://localhost:8000'
  ],
  credentials: true
}));
app.use(express.json());

// Proxy endpoint for check-payment
app.get('/api/check-payment', async (req, res) => {
  try {
    const { transactionId, checkoutId } = req.query;
    
    // Your Supabase project URL
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    
    let url = `${SUPABASE_URL}/functions/v1/check-payment?`;
    
    if (transactionId) url += `transactionId=${transactionId}`;
    if (checkoutId) url += `checkoutId=${checkoutId}`;
    
    console.log('Proxying to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

// Proxy endpoint for initiate-payment (POST)
app.post('/api/initiate-payment', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    
    const url = `${SUPABASE_URL}/functions/v1/initiate-payment`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
