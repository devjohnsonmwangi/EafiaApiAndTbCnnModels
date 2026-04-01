/**
 * Database Schema Push Script for Neon Serverless PostgreSQL
 *
 * This script synchronizes the TypeORM entities with the Neon database schema.
 * Use this in CI/CD pipelines or when deploying to production.
 *
 * Usage:
 *   npm run db:push                    # Sync schema (safe - no data loss)
 *   NODE_ENV=production npm run db:push # Production deployment
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
    migrations: [
      path.join(__dirname, '../src/config/migrations/**/*{.ts,.js}'),
    ],
    synchronize: false, // We handle sync manually
    logging: true,
    ssl:
      process.env.DATABASE_SSL_MODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
    maxQueryExecutionTime: 2000,
  });
};

const pushSchema = async (): Promise<void> => {
  const dataSource = createDataSource();

  try {
    console.log('🔌 Connecting to Neon database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully');

    console.log('\n📊 Checking database schema...');
    await dataSource.synchronize(false);
    console.log('✅ Schema check passed');

    console.log('\n🔄 Synchronizing schema with entities...');
    // Get the query runner for the first database connection
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Log tables info
      const tables = await queryRunner.getTables();
      console.log(`\n📋 Found ${tables.length} tables:`);
      tables.forEach((table) => {
        console.log(`   - ${table.name} (${table.columns.length} columns)`);
      });

      console.log('\n✨ Running synchronization...');
      await dataSource.synchronize();
      console.log('✅ Schema synchronized successfully!');

      // Display schema info
      console.log('\n📈 Database Schema Summary:');
      for (const table of tables) {
        const indexes = table.indices.length;
        const relations = table.foreignKeys.length;
        console.log(`   ${table.name}:`);
        console.log(`     - Columns: ${table.columns.length}`);
        console.log(`     - Indexes: ${indexes}`);
        console.log(`     - Foreign Keys: ${relations}`);
      }
    } finally {
      await queryRunner.release();
    }

    console.log('\n✅ Database push completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Verify the schema in your Neon dashboard');
    console.log('   2. Run migrations if needed: npm run db:migrate:run');
    console.log('   3. Seed data if needed: npm run db:seed');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database push failed:', error);
    console.error('\n🔍 Troubleshooting:');
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('   - Check DATABASE_URL in .env');
        console.error('   - Verify Neon database is running');
        console.error('   - Check network connectivity');
      } else if (error.message.includes('FATAL')) {
        console.error('   - Authentication failed');
        console.error('   - Verify DATABASE_USER and DATABASE_PASSWORD');
      } else if (error.message.includes('does not exist')) {
        console.error('   - Database does not exist');
        console.error('   - Create database in Neon console first');
      }
    }
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

// Run the script
pushSchema().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
