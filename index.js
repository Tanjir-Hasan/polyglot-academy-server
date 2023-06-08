const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(express.json());
app.use(cors());

// routes

app.get('/', (req, res) => {
  res.send('Summer Camp');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
