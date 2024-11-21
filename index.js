const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiUrl = `https://api.example.com/videogames?query=${encodeURIComponent(userMessage)}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });
    const data = await response.json();
    res.json({ reply: data });
  } catch (error) {
    console.error('Error fetching data from API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(4545, () => console.log(`Server started on port 4545`));