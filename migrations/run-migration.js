const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'gymsinhvien'
    });

    try {
        // Add new columns
        await connection.execute(`
            ALTER TABLE \`orders\` 
            ADD COLUMN \`tracking_number\` varchar(100) DEFAULT NULL AFTER \`handled_by\`,
            ADD COLUMN \`shipping_carrier\` varchar(100) DEFAULT NULL AFTER \`tracking_number\`,
            ADD COLUMN \`processing_at\` timestamp NULL DEFAULT NULL AFTER \`shipping_carrier\`
        `);

        // Add index
        await connection.execute(`
            ALTER TABLE \`orders\` ADD INDEX \`idx_tracking_number\` (\`tracking_number\`)
        `);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            return;
        } else {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    } finally {
        await connection.end();
    }
}

runMigration().catch(console.error);
