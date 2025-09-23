require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'gymsinhvien',
  };

  console.log('Using DB config:', {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    database: cfg.database,
  });

  let conn;
  try {
    conn = await mysql.createConnection(cfg);
    console.log('Connected to DB');

    const [cols] = await conn.query("DESCRIBE users");
    console.log('\nDESCRIBE users:');
    console.table(cols);

    const [create] = await conn.query("SHOW CREATE TABLE users");
    console.log('\nSHOW CREATE TABLE users:');
    console.log(create[0]['Create Table']);

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting DB/table:', err.message || err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

run();
