const { Pool } = require('pg');

// Используем DATABASE_URL от Render, если её нет — твои локальные данные
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:XBZ0nH8MO61bwi4lcDYFunICtJvk8802@localhost:5432/online_library';

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;