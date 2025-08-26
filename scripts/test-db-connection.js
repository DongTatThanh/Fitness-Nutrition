const { DataSource } = require('typeorm');
require('dotenv').config();

async function run() {
  const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'fitness_app',
  });

  try {
    await AppDataSource.initialize();
    console.log('Database connection OK');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

run();
