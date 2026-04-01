# 🗄️ Database Setup Guide - PostgreSQL + TypeORM + Neon

Complete guide for setting up and configuring the PostgreSQL database with TypeORM for Eafia TB Detection API.

---

## 📋 Table of Contents

1. [Local PostgreSQL Setup](#local-postgresql-setup)
2. [Neon Serverless Setup](#neon-serverless-setup)
3. [TypeORM Configuration](#typeorm-configuration)
4. [Database Schema](#database-schema)
5. [Migrations & Seeding](#migrations-seeding)
6. [Monitoring & Maintenance](#monitoring-maintenance)

---

## 🖥️ Local PostgreSQL Setup

### Option 1: Install PostgreSQL Locally

#### macOS (Using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql

# Verify installation
psql --version

# Create admin user
createuser -P postgres
# Enter password when prompted
```

#### Windows (Using Installer)

1. Download PostgreSQL: https://www.postgresql.org/download/windows/
2. Run installer with defaults
3. Remember password for `postgres` user
4. Install Stack Builder for additional tools

#### Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Verify
psql --version
```

### Create Development Database

```bash
# Connect as postgres user
psql -U postgres

# Inside psql prompt:
CREATE DATABASE eafia_tb_detection;

CREATE USER eafia_user WITH PASSWORD 'your_secure_password';

ALTER ROLE eafia_user SET client_encoding TO 'utf8';
ALTER ROLE eafia_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE eafia_user SET default_transaction_deferrable TO on;
ALTER ROLE eafia_user SET default_transaction_read_only TO off;

GRANT ALL PRIVILEGES ON DATABASE eafia_tb_detection TO eafia_user;

# Connect to the database
\c eafia_tb_detection

# Grant schema privileges
GRANT ALL ON SCHEMA public TO eafia_user;

# Exit psql
\q
```

### Verify Connection

```bash
# Test connection with your new user
psql -U eafia_user -d eafia_tb_detection -h localhost -W

# You should see:
# psql (15.0)
# Type "help" for help.
# eafia_tb_detection=>
```

---

## 🌩️ Neon Serverless Setup

### What is Neon?

**Neon** is a serverless PostgreSQL platform perfect for development and production:
- ✅ Free tier with 5GB storage
- ✅ Auto-scaling
- ✅ Built-in backups
- ✅ No server management
- ✅ Global availability

### Step 1: Create Neon Account

1. Visit: https://console.neon.tech
2. Sign up with email or GitHub
3. Create a new project
4. Choose region closest to your users

### Step 2: Get Connection String

1. In Neon dashboard, select your project
2. Click "Connect"
3. Copy the full connection string:
   ```
   postgresql://neon_user:password@ep-cool-name-123.neon.tech/eafia_tb_detection?sslmode=require
   ```

### Step 3: Add Connection String to .env

Edit `.env.development` or `.env.production`:

```bash
# For development (using local PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=eafia_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=eafia_tb_detection

# OR for Neon Serverless
DATABASE_URL=postgresql://neon_user:password@ep-cool-name-123.neon.tech/eafia_tb_detection?sslmode=require
```

### Step 4: Test Neon Connection

```bash
# Install Neon CLI (optional)
npm install -g neon

# Or test connection with psql
psql "postgresql://neon_user:password@ep-cool-name-123.neon.tech/eafia_tb_detection?sslmode=require"

# You should see the psql prompt
```

---

## ⚙️ TypeORM Configuration

### Current Configuration

The database configuration is in [src/config/typeorm.config.ts](src/config/typeorm.config.ts):

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [path.join(__dirname, '/../modules/**/*.entity{.ts,.js}')],
    synchronize: isDevelopment, // Auto-create tables in dev
    logging: isDevelopment, // Log queries in dev
    logger: 'advanced-console',
    maxQueryExecutionTime: 1000, // Warn if query > 1s
  };

  // Local PostgreSQL or Neon
  if (process.env.DATABASE_URL) {
    config.url = process.env.DATABASE_URL; // Neon
  } else {
    config.host = process.env.DATABASE_HOST;
    config.port = parseInt(process.env.DATABASE_PORT || '5432');
    config.username = process.env.DATABASE_USER;
    config.password = process.env.DATABASE_PASSWORD;
    config.database = process.env.DATABASE_NAME;
  }

  // Production-specific settings
  if (isProduction) {
    config.synchronize = false; // Don't auto-sync in production
    config.logging = false; // No query logs
    config.ssl = { rejectUnauthorized: false }; // Required for Neon
  }

  return config;
};

export const dataSource = new DataSource({
  type: 'postgres',
  ...typeOrmConfig(),
} as DataSourceOptions);
```

### Synchronize vs Migrations

#### Synchronize (Development)
```typescript
// .env.development
synchronize: true  // ✅ Good for rapid development
```
- Automatically updates schema on app startup
- No migration files needed
- Can lose data on schema changes
- **Never use in production**

#### Migrations (Production)
```typescript
// .env.production
synchronize: false  // ✅ Required for production
```
- Explicit schema changes
- Reversible
- Version controlled
- **Recommended for production**

---

## 💾 Database Schema

### Entity Relationships Diagram

```
┌──────────────┐
│    Users     │
├──────────────┤
│ id (PK)      │
│ email (UQ)   │
│ role         │
│ password     │
│ isActive     │
└──────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────┐
│    Patients      │
├──────────────────┤
│ id (PK)          │
│ physiciandId (FK)│
│ firstName        │
│ lastName         │
│ email (UQ)       │
│ dateOfBirth      │
│ medicalHistory   │
│ deletedAt        │
└──────────────────┘
       │
       ├─ 1:N ─────┬──────────────┐
       │           │              │
       ▼           ▼              ▼
   ┌────────┐  ┌───────┐   ┌─────────────┐
   │ XRays  │  │ Dx Rs │   │ (Soft Del)  │
   └────────┘  └───────┘   └─────────────┘
```

### Full Schema Details

```sql
-- Users Table
CREATE TABLE "user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE NOT NULL,
  "firstName" varchar NOT NULL,
  "lastName" varchar NOT NULL,
  "passwordHash" varchar NOT NULL,
  "role" varchar NOT NULL, -- PHYSICIAN, ADMIN, SUPER_ADMIN
  "license" varchar,
  "specialization" varchar,
  "phone" varchar,
  "isActive" boolean DEFAULT true,
  "lastLoginIp" varchar,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" timestamp,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_createdAt (createdAt)
);

-- Patients Table
CREATE TABLE "patient" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" varchar NOT NULL,
  "lastName" varchar NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "phone" varchar,
  "dateOfBirth" date,
  "gender" varchar, -- Male, Female, Other
  "medicalHistory" text,
  "allergies" text,
  "medications" text,
  "address" varchar,
  "city" varchar,
  "state" varchar,
  "postalCode" varchar,
  "country" varchar,
  "physicianId" uuid NOT NULL,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" timestamp,
  FOREIGN KEY (physicianId) REFERENCES "user"(id),
  INDEX idx_physicianId (physicianId),
  INDEX idx_email (email),
  INDEX idx_createdAt (createdAt)
);

-- XRays Table
CREATE TABLE "xray" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" uuid NOT NULL,
  "imageBase64" text NOT NULL,
  "fileName" varchar NOT NULL,
  "fileType" varchar,
  "fileSizeBytes" integer,
  "status" varchar DEFAULT 'PENDING', -- PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED
  "xrayType" varchar,
  "notes" text,
  "isValid" boolean,
  "validationConfidence" float,
  "validationError" text,
  "deviceIpAddress" varchar,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" timestamp,
  FOREIGN KEY (patientId) REFERENCES "patient"(id),
  INDEX idx_patientId (patientId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);

-- DiagnosisResults Table
CREATE TABLE "diagnosis_result" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" uuid NOT NULL,
  "xrayId" uuid NOT NULL,
  "diseaseType" varchar,
  "prediction" varchar,
  "confidenceScore" float,
  "confidenceLevel" varchar, -- LOW, MODERATE, HIGH, VERY_HIGH
  "tbIntensity" varchar, -- NONE, MILD, MODERATE, SEVERE, CRITICAL
  "affectedAreas" text,
  "affectedPercentage" float,
  "heatmapBase64" text,
  "clinicalFindings" text,
  "recommendations" text,
  "modelName" varchar,
  "processingTimeMs" integer,
  "deviceIpAddress" varchar,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" timestamp,
  FOREIGN KEY (patientId) REFERENCES "patient"(id),
  FOREIGN KEY (xrayId) REFERENCES "xray"(id),
  INDEX idx_patientId (patientId),
  INDEX idx_xrayId (xrayId),
  INDEX idx_diseaseType (diseaseType),
  INDEX idx_createdAt (createdAt)
);
```

---

## 🔄 Migrations & Seeding

### Creating Migrations (When Needed)

When `synchronize: false` in production, create migrations:

```bash
# Install TypeORM CLI
npm install -g typeorm

# Generate migration from entity changes
typeorm migration:generate src/migrations/InitialSchema

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeding Initial Data

Create seed file: `src/database/seeds/seed.ts`

```typescript
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../modules/users/entities/user.entity';
import { User } from '../modules/users/entities/user.entity';

export async function seed(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if data exists
  const count = await userRepository.count();
  if (count > 0) {
    console.log('Database already seeded');
    return;
  }

  // Create super admin
  const superAdmin = new User();
  superAdmin.email = 'admin@eafia.com';
  superAdmin.firstName = 'System';
  superAdmin.lastName = 'Administrator';
  superAdmin.password = await bcrypt.hash('AdminPassword123!', 10);
  superAdmin.role = UserRole.SUPER_ADMIN;
  superAdmin.isActive = true;

  await userRepository.save(superAdmin);

  console.log('✅ Database seeded with super admin');
  console.log('Email: admin@eafia.com');
  console.log('Password: AdminPassword123!');
}
```

Run seed on startup:

```typescript
// In main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Run migrations/seeds if needed
  if (process.env.RUN_SEEDS === 'true') {
    const dataSource = app.get(DataSource);
    await seed(dataSource);
  }
  
  await app.listen(3000);
}
```

---

## 📊 Monitoring & Maintenance

### Database Backups

#### Backup PostgreSQL Database

```bash
# Local backup
pg_dump -U eafia_user -d eafia_tb_detection > backup.sql

# Restore from backup
psql -U eafia_user -d eafia_tb_detection < backup.sql
```

#### Neon Automatic Backups

Neon provides:
- Daily backups (7-day retention)
- Point-in-time recovery
- No manual configuration needed

### Monitor Database Performance

```typescript
// Enable slow query logging in .env
DB_LOG_LEVEL=all  // Log all queries

// Check for slow queries in logs:
// ⚠️ WARNING: query took longer than 1 second
```

### Common Database Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Database offline | Check database service status |
| Connection refused | Wrong credentials | Verify .env DATABASE_URL |
| SSL error (Neon) | Missing SSL config | Add `sslmode=require` to URL |
| Table not found | Synchronize=false with no migrations | Run migrations or set synchronize=true |
| Slow queries | Missing indexes | Check performance, add indexes as needed |

### Query Performance Analysis

```sql
-- Analyze query performance (PostgreSQL)
EXPLAIN ANALYZE SELECT * FROM patient WHERE "physicianId" = 'uuid-here';

-- Should use index if properly indexed
-- Output shows execution plan and actual time
```

---

## 🔐 Security Best Practices

### Database Credentials

1. **Never commit credentials:**
   ```bash
   # .env files MUST NOT be in git
   # .gitignore should contain:
   .env
   .env.development
   .env.production
   ```

2. **Use strong passwords:**
   ```bash
   # Generate 32-char random password
   openssl rand -base64 32
   # Example: jX2pK9mL8qR4tU7vW1xY2zAbBcDeFgHiJkL
   ```

3. **Rotate passwords regularly:**
   - Change database password every 90 days
   - Update .env and restart service

### Database Encryption

#### Neon Built-in Security
- ✅ Encryption at rest
- ✅ SSL/TLS transport
- ✅ IP allowlisting available
- ✅ Database user role isolation

#### Additional Security
```typescript
// In typeorm.config.ts
if (isProduction) {
  config.ssl = {
    rejectUnauthorized: false,
    ca: process.env.DB_CA_CERT, // Optional: CA certificate
  };
  
  config.url = process.env.DATABASE_URL; // Keep in encrypted vault
}
```

---

## 📈 Connection Pooling

### TypeORM Connection Pool Settings

```typescript
// In typeorm.config.ts
export const typeOrmConfig = (): TypeOrmModuleOptions => {
  return {
    ...existingConfig,
    
    // Connection pool
    extra: {
      max: 20, // Maximum connections
      min: 5,  // Minimum connections
      idleTimeoutMillis: 30000, // Close idle connections
      connectionTimeoutMillis: 5000,
    },
  };
};
```

### Monitor Connections

```bash
# View active connections
psql -U postgres -d eafia_tb_detection -c "SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;"
```

---

## 🚀 Optimization Tips

1. **Add frequent query indexes:**
   ```typescript
   // In entities
   @Index()
   @Column()
   physicianId: string;
   ```

2. **Use pagination for large queries:**
   ```typescript
   // In services
   const patients = await this.patientRepository.find({
     skip: page * pageSize,
     take: pageSize,
   });
   ```

3. **Eager/Lazy load relations carefully:**
   ```typescript
   // Only load relations when needed
   const patient = await this.patientRepository.findOne({
     where: { id },
     relations: ['xrays'] // Only if needed
   });
   ```

4. **Use caching:**
   ```typescript
   // Cache frequently accessed data
   @Cacheable({ ttl: 3600 }) // 1 hour
   async getPatient(id: string) {
     return this.patientRepository.findOne({ where: { id } });
   }
   ```

---

## ✅ Database Setup Verification Checklist

- [ ] PostgreSQL installed locally or Neon account created
- [ ] Database created (`eafia_tb_detection`)
- [ ] Database user created with password
- [ ] `.env.development` or `.env.production` updated with DB credentials
- [ ] TypeORM configuration points to correct database
- [ ] Test connection successful (`npm install` then `npm run typeorm migration:show`)
- [ ] Entity files exist in `src/modules/*/`
- [ ] `synchronize: true` in development (auto-creates tables)
- [ ] `synchronize: false` in production (use migrations)
- [ ] All indexes properly configured in entities
- [ ] Soft delete fields (`deletedAt`) present in entities
- [ ] Foreign key relationships configured in entities

---

## 🎯 Next Steps

1. **Local Development:**
   - Set up local PostgreSQL
   - Run `npm install`
   - Run `npm run start:dev`
   - Check Swagger at http://localhost:3000/api

2. **Production Deployment:**
   - Create Neon Serverless account
   - Copy DATABASE_URL to .env.production
   - Create migrations for schema
   - Deploy application
   - Verify connection with health check

3. **Monitoring:**
   - Set up database monitoring (New Relic, DataDog)
   - Configure alerts for slow queries
   - Monitor connection pool usage
   - Schedule regular backups (Neon does this automatically)

---

**Database setup complete! Ready to start development.** 🚀
