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

  const createSql = `
CREATE TABLE IF NOT EXISTS password_resets (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX (token),
  INDEX (user_id),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  let conn;
  try {
    console.log('Using DB config:', { host: cfg.host, port: cfg.port, user: cfg.user, database: cfg.database });
    conn = await mysql.createConnection(cfg);
    console.log('Connected to DB');
    await conn.query(createSql);
    console.log('password_resets table created (or already existed)');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creating password_resets table:', err.message || err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

run();
