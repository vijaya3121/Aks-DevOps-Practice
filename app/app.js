const express = require('express');
const app = express();

const APP_NAME = process.env.APP_NAME || "NodeApp";
const APP_ENV = process.env.APP_ENV || "local";
const DB_PASSWORD = process.env.DB_PASSWORD || "not-set";

app.get('/', (req, res) => {
  res.send(`
    <h2>${APP_NAME}</h2>
    <p>Environment: ${APP_ENV}</p>
    <p>DB Password Loaded: ${DB_PASSWORD ? "YES" : "NO"}</p>
  `);
});

app.listen(3000, () => {
  console.log('App running on port 3000');
});
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

