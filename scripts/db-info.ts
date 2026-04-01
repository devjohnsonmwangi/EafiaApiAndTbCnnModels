/**
 * Database Information & Connection Verification Script
 *
 * This script displays database connection information and schema details.
 * Useful for debugging and verifying database setup.
 *
 * Usage:
 *   npm run db:info
 */

import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const createDataSource = (): DataSource => {
  return new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
    logging: false,
    ssl:
      process.env.DATABASE_SSL_MODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
  });
};

const maskPassword = (url: string): string => {
  return url.replace(/:([^@]+)@/, ':****@');
};

const getDbInfo = async (): Promise<void> => {
  const dataSource = createDataSource();

  try {
    console.log('🔍 Database Information & Connection Details\n');
    console.log('='.repeat(60));

    // Display connection info (masked)
    console.log('\n📡 Connection Configuration:');
    console.log(`   Host: ${process.env.DATABASE_HOST}`);
    console.log(`   Port: ${process.env.DATABASE_PORT}`);
    console.log(`   Database: ${process.env.DATABASE_NAME}`);
    console.log(`   User: ${process.env.DATABASE_USER}`);
    const poolerStatus =
      (process.env.DATABASE_HOST?.includes('pooler') ?? false)
        ? 'Enabled'
        : 'Disabled';
    console.log(`   Neon Pooler: Yes (${poolerStatus})`);
    console.log(`   SSL Mode: ${process.env.DATABASE_SSL_MODE}`);
    const dbUrl = process.env.DATABASE_URL ?? '';
    console.log(`   URL: ${maskPassword(dbUrl)}`);

    // Connection settings
    console.log('\n⚙️  Connection Pool Settings:');
    console.log(`   Synchronize: ${process.env.TYPEORM_SYNCHRONIZE}`);
    console.log(`   Logging: ${process.env.TYPEORM_LOGGING}`);
    console.log(`   Migrations Run: ${process.env.TYPEORM_MIGRATIONS_RUN}`);
    console.log(`   Max Query Time: 1000ms`);
    const connLimit = process.env.DATABASE_CONNECTION_LIMIT ?? '20';
    console.log(`   Connection Limit: ${connLimit}`);

    // Try to connect
    console.log('\n🔌 Attempting Connection...');
    await dataSource.initialize();
    console.log('✅ Connection successful!\n');

    // Get tables
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      const tables = await queryRunner.getTables();

      console.log('📊 Database Schema:');
      console.log(`   Total Tables: ${tables.length}\n`);

      if (tables.length === 0) {
        console.log('   ⚠️  No tables found. Run: npm run db:push');
      } else {
        for (const table of tables) {
          console.log(`   📋 ${table.name}`);
          console.log(`      Columns: ${table.columns.length}`);
          console.log(`      Indexes: ${table.indices.length}`);
          console.log(`      Foreign Keys: ${table.foreignKeys.length}`);

          // Show key columns
          const pkColumns = table.columns.filter((c) => c.isPrimary);
          if (pkColumns.length > 0) {
            const pkNames = pkColumns.map((c) => c.name).join(', ');
            console.log(`      Primary Keys: ${pkNames}`);
          }
        }
      }

      // Environment
      const nodeEnv = process.env.NODE_ENV ?? 'development';
      const port = process.env.GATEWAY_PORT ?? '3000';
      const mlUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:5000';
      console.log(`\n🌍 Environment:\n   NODE_ENV: ${nodeEnv}`);
      console.log(`   Port: ${port}`);
      console.log(`   ML Service: ${mlUrl}`);

      // Status
      console.log(`\n${'='.repeat(60)}`);
      console.log('✅ All systems operational!\n');
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    if (error instanceof Error) {
      console.error('\n📝 Error Details:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.log(
          '\n💡 Fix: Verify DATABASE_URL is correct and database is running',
        );
      } else if (error.message.includes('FATAL')) {
        console.log(
          '\n💡 Fix: Check DATABASE_USER and DATABASE_PASSWORD in .env',
        );
      }
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

// Run the script
getDbInfo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
