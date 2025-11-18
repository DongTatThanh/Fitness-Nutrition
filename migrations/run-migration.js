const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'gymsinhvien'
    });

    console.log('Connected to database...');

    try {
        // Add new columns
        await connection.execute(`
            ALTER TABLE \`orders\` 
            ADD COLUMN \`tracking_number\` varchar(100) DEFAULT NULL AFTER \`handled_by\`,
            ADD COLUMN \`shipping_carrier\` varchar(100) DEFAULT NULL AFTER \`tracking_number\`,
            ADD COLUMN \`processing_at\` timestamp NULL DEFAULT NULL AFTER \`shipping_carrier\`
        `);
        console.log('✓ Added tracking_number, shipping_carrier, processing_at columns');

        // Add index
        await connection.execute(`
            ALTER TABLE \`orders\` ADD INDEX \`idx_tracking_number\` (\`tracking_number\`)
        `);
        console.log('✓ Added index on tracking_number');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠ Columns already exist, skipping...');
        } else {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    } finally {
        await connection.end();
    }
}

runMigration().catch(console.error);
