const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'online_library',
  password: 'temp123%', 
  port: 5432,
});

module.exports = pool;