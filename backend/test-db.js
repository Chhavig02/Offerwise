/* eslint-disable */
require('dotenv').config();
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to backend/.env before running this script.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => {
    console.log('CONNECTED SUCCESSFULLY');
    process.exit(0);
  })
  .catch(err => {
    console.error('CONNECTION ERROR:', err.message);
    process.exit(1);
  });
