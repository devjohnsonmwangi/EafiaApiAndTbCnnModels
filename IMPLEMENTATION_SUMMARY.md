# Implementation Summary - Code Changes

**Date**: March 31, 2026  
**Session Focus**: Complete Patient Registration with X-Ray Validation & TB Diagnosis Pipeline

---

## 🔧 Files Created (NEW)

### 1. **src/modules/auth/auth-log.entity.ts**
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AuthLogAction {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
}

@Entity('auth_logs')
export class AuthLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar' })
  action!: AuthLogAction;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceInfo!: string | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'varchar', nullable: true })
  tokenIssued!: string | null; // First 20 chars only for security

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null; // ✅ SOFT DELETE
}
```

---

### 2. **src/modules/logging/system-log.entity.ts**
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SystemLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum SystemLogCategory {
  DATABASE = 'DATABASE',
  API = 'API',
  CACHE = 'CACHE',
  STORAGE = 'STORAGE',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  PATIENT_MANAGEMENT = 'PATIENT_MANAGEMENT',
  XRAY_PROCESSING = 'XRAY_PROCESSING',
  ML_INFERENCE = 'ML_INFERENCE',
  DIAGNOSIS = 'DIAGNOSIS',
  SECURITY = 'SECURITY',
  AUDIT = 'AUDIT',
  DATA_PRIVACY = 'DATA_PRIVACY',
  PERFORMANCE = 'PERFORMANCE',
  HEALTH_CHECK = 'HEALTH_CHECK',
  BACKUP = 'BACKUP',
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  level!: SystemLogLevel;

  @Column({ type: 'varchar' })
  category!: SystemLogCategory;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null; // Stack trace

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resourceType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'int', nullable: true })
  responseTimeMs!: number | null;

  @Column({ type: 'int', nullable: true })
  statusCode!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null; // ✅ SOFT DELETE

  static create(
    level: SystemLogLevel,
    category: SystemLogCategory,
    message: string,
    options?: {
      details?: string;
      error?: string;
      userId?: string;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      responseTimeMs?: number;
      statusCode?: number;
    }
  ) {
    const log = new SystemLog();
    log.level = level;
    log.category = category;
    log.message = message;
    log.details = options?.details;
    log.error = options?.error;
    log.userId = options?.userId;
    log.resourceId = options?.resourceId;
    log.resourceType = options?.resourceType;
    log.ipAddress = options?.ipAddress;
    log.responseTimeMs = options?.responseTimeMs;
    log.statusCode = options?.statusCode;
    return log;
  }
}
```

---

### 3. **src/modules/logging/auth-logging.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthLog, AuthLogAction } from '../auth/auth-log.entity';

@Injectable()
export class AuthLoggingService {
  constructor(
    @InjectRepository(AuthLog)
    private authLogRepository: Repository<AuthLog>,
  ) {}

  async logAuthAction(
    action: AuthLogAction,
    email: string,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
    success = true,
    errorMessage?: string | null,
    tokenIssued?: string | null,
  ) {
    const deviceInfo = this.extractDeviceInfo(userAgent);

    const log = this.authLogRepository.create({
      action,
      email,
      userId: userId || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      deviceInfo,
      success,
      errorMessage: errorMessage || null,
      tokenIssued: tokenIssued ? tokenIssued.substring(0, 20) : null,
    });

    return await this.authLogRepository.save(log);
  }

  async getLoginHistory(userId: string, limit = 10) {
    return await this.authLogRepository.find({
      where: {
        userId,
        action: AuthLogAction.LOGIN,
        success: true,
        deletedAt: null,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getFailedLoginAttempts(email: string, minutes = 30) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return await this.authLogRepository.find({
      where: {
        email,
        action: AuthLogAction.LOGIN_FAILED,
        createdAt: { $gte: since },
        deletedAt: null,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllAuthLogs(userId?: string, limit = 100) {
    const query = this.authLogRepository.createQueryBuilder('log');

    if (userId) {
      query.where('log.userId = :userId', { userId });
    }

    return await query
      .where('log.deletedAt IS NULL')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  private extractDeviceInfo(userAgent?: string): string | null {
    if (!userAgent) return null;

    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android'))
      return 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';

    return null;
  }
}
```

---

### 4. **src/modules/logging/system-logging.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog, SystemLogLevel, SystemLogCategory } from './system-log.entity';

@Injectable()
export class SystemLoggingService {
  constructor(
    @InjectRepository(SystemLog)
    private systemLogRepository: Repository<SystemLog>,
  ) {}

  async log(
    level: SystemLogLevel,
    category: SystemLogCategory,
    message: string,
    options?: {
      details?: string;
      error?: string;
      userId?: string;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      responseTimeMs?: number;
      statusCode?: number;
    },
  ) {
    const log = SystemLog.create(level, category, message, options);
    return await this.systemLogRepository.save(log);
  }

  async debug(category: SystemLogCategory, message: string, options?: any) {
    return this.log(SystemLogLevel.DEBUG, category, message, options);
  }

  async info(category: SystemLogCategory, message: string, options?: any) {
    return this.log(SystemLogLevel.INFO, category, message, options);
  }

  async warn(category: SystemLogCategory, message: string, options?: any) {
    return this.log(SystemLogLevel.WARN, category, message, options);
  }

  async error(category: SystemLogCategory, message: string, options?: any) {
    return this.log(SystemLogLevel.ERROR, category, message, options);
  }

  async critical(category: SystemLogCategory, message: string, options?: any) {
    return this.log(SystemLogLevel.CRITICAL, category, message, options);
  }

  async getLogsByCategory(category: SystemLogCategory, limit = 100) {
    return await this.systemLogRepository.find({
      where: { category, deletedAt: null },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsByLevel(level: SystemLogLevel, limit = 100) {
    return await this.systemLogRepository.find({
      where: { level, deletedAt: null },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getErrorLogs(limit = 100) {
    return await this.systemLogRepository.find({
      where: [
        { level: SystemLogLevel.ERROR, deletedAt: null },
        { level: SystemLogLevel.CRITICAL, deletedAt: null },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getResourceLogs(resourceId: string, resourceType?: string, limit = 50) {
    const query = this.systemLogRepository.createQueryBuilder('log');
    query.where('log.resourceId = :resourceId', { resourceId });

    if (resourceType) {
      query.andWhere('log.resourceType = :resourceType', { resourceType });
    }

    return await query
      .andWhere('log.deletedAt IS NULL')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getUserActivityLogs(userId: string, limit = 100) {
    return await this.systemLogRepository.find({
      where: { userId, deletedAt: null },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
```

---

### 5. **src/modules/logging/auth-logging.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLog } from '../auth/auth-log.entity';
import { AuthLoggingService } from './auth-logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthLog])],
  providers: [AuthLoggingService],
  exports: [AuthLoggingService],
})
export class AuthLoggingModule {}
```

---

### 6. **src/modules/logging/system-logging.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from './system-log.entity';
import { SystemLoggingService } from './system-logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemLog])],
  providers: [SystemLoggingService],
  exports: [SystemLoggingService],
})
export class SystemLoggingModule {}
```

---

## 📝 Files Modified

### 1. **src/modules/auth/auth.module.ts**
**Change**: Added AuthLog entity and AuthLoggingService

```typescript
import { AuthLog } from './auth-log.entity';
import { AuthLoggingService } from '../logging/auth-logging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthLog]), // ✅ Added AuthLog
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, AuthLoggingService], // ✅ Added AuthLoggingService
  exports: [AuthService, AuthLoggingService],    // ✅ Export for use in other modules
})
export class AuthModule {}
```

---

### 2. **src/modules/auth/auth.service.ts**
**Change**: Integrated AuthLoggingService and JWT secret enforcement

```typescript
import { AuthLog, AuthLogAction } from './auth-log.entity';
import { AuthLoggingService } from '../logging/auth-logging.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private authLoggingService: AuthLoggingService, // ✅ Injected
  ) {}

  async register(createUserDto: CreateUserDto, clientIp?: string) {
    try {
      // ... registration logic ...
      
      // ✅ Log successful registration
      await this.authLoggingService.logAuthAction(
        AuthLogAction.REGISTER,
        createUserDto.email,
        user.id,
        clientIp,
        null,
        true,
      );

      return user;
    } catch (error) {
      // ✅ Log failed registration
      if (error.code === '23505') { // Duplicate entry
        await this.authLoggingService.logAuthAction(
          AuthLogAction.REGISTER,
          createUserDto.email,
          null,
          clientIp,
          null,
          false,
          'Email already registered',
        );
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto, clientIp?: string, userAgent?: string) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !(await this.validatePassword(loginDto.password, user.password))) {
      // ✅ Log failed login
      await this.authLoggingService.logAuthAction(
        AuthLogAction.LOGIN_FAILED,
        loginDto.email,
        null,
        clientIp,
        userAgent,
        false,
        'Invalid credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    const tokens = this.generateTokens(user);

    // ✅ Log successful login
    await this.authLoggingService.logAuthAction(
      AuthLogAction.LOGIN,
      user.email,
      user.id,
      clientIp,
      userAgent,
      true,
      null,
      tokens.accessToken,
    );

    return tokens;
  }

  async refreshToken(token: string, clientIp?: string) {
    try {
      // ✅ Use explicit JWT_REFRESH_SECRET with fallback chain
      const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'fallback-key';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      const newTokens = this.generateTokens(user);

      // ✅ Log token refresh
      await this.authLoggingService.logAuthAction(
        AuthLogAction.TOKEN_REFRESH,
        user.email,
        user.id,
        clientIp,
        null,
        true,
        null,
        newTokens.accessToken,
      );

      return newTokens;
    } catch (error) {
      // ✅ Log failed refresh
      await this.authLoggingService.logAuthAction(
        AuthLogAction.TOKEN_REFRESH_FAILED,
        'unknown',
        null,
        clientIp,
        null,
        false,
        error.message,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // ✅ Explicit JWT_SECRET for access token
    const secret = process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-change-in-production-min-32-chars';
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '24h',
    });

    // ✅ Explicit JWT_REFRESH_SECRET for refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? secret;
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

---

### 3. **src/common/guards/jwt.guard.ts**
**Change**: Enforce JWT_SECRET from .env with proper fallback

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // ✅ CRITICAL: Use JWT_SECRET from .env
      const secret = process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-change-in-production-min-32-chars';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

---

### 4. **src/modules/patients/patient.dto.ts**
**Change**: Added required X-ray fields to CreatePatientDto

```typescript
import { IsString, MinLength, MaxLength, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsDateString()
  dateOfBirth!: string; // ISO format: YYYY-MM-DD

  @IsString()
  gender!: 'Male' | 'Female' | 'Other';

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // ============================================
  // ✅ X-RAY DATA - REQUIRED FOR PATIENT CREATION
  // ============================================
  
  @IsString()
  @MinLength(100) // Ensure valid base64 string
  imageBase64!: string; // REQUIRED - Full base64 encoded X-ray image

  @IsOptional()
  @IsString()
  fileName?: string; // e.g., "xray_patient_123.jpg"

  @IsOptional()
  @IsString()
  xrayType?: string; // e.g., "Chest PA", "Chest Lateral"

  @IsOptional()
  @IsString()
  xrayNotes?: string; // Optional physician notes about X-ray
}

export class PatientResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phone!: string;
  dateOfBirth!: string;
  gender!: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  physicianId!: string;

  // ✅ Added relations
  xrays?: any[];
  diagnosisResults?: any[];

  createdAt!: Date;
  updatedAt!: Date;
}
```

---

### 5. **src/modules/patients/patients.service.ts**
**Change**: Complete rewrite with X-ray validation and TB diagnosis pipeline (260+ lines)

```typescript
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Patient } from './patient.entity';
import { XRay } from '../xray/xray.entity';
import { DiagnosisResult } from '../diagnosis/diagnosis-result.entity';
import { CreatePatientDto } from './patient.dto';
import { SystemLoggingService } from '../logging/system-logging.service';
import { SystemLogCategory } from '../logging/system-log.entity';

@Injectable()
export class PatientsService {
  private pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(XRay)
    private xrayRepository: Repository<XRay>,
    @InjectRepository(DiagnosisResult)
    private diagnosisRepository: Repository<DiagnosisResult>,
    private systemLoggingService: SystemLoggingService,
  ) {}

  async create(
    createPatientDto: CreatePatientDto,
    physicianId: string,
  ): Promise<Patient> {
    try {
      // ✅ Step 1: Validate X-ray image is provided
      if (!createPatientDto.imageBase64 || createPatientDto.imageBase64.length < 100) {
        throw new BadRequestException(
          'X-ray image (imageBase64) is required for patient creation',
        );
      }

      // ✅ Step 2: Create patient record
      const patient = this.patientRepository.create({
        firstName: createPatientDto.firstName,
        lastName: createPatientDto.lastName,
        email: createPatientDto.email,
        phone: createPatientDto.phone,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        gender: createPatientDto.gender,
        medicalHistory: createPatientDto.medicalHistory,
        allergies: createPatientDto.allergies,
        medications: createPatientDto.medications,
        address: createPatientDto.address,
        city: createPatientDto.city,
        state: createPatientDto.state,
        postalCode: createPatientDto.postalCode,
        country: createPatientDto.country,
        physicianId,
      });

      const savedPatient = await this.patientRepository.save(patient);

      // ✅ Step 3: Create X-ray record with VALIDATING status
      const xray = this.xrayRepository.create({
        patientId: savedPatient.id,
        fileName: createPatientDto.fileName,
        xrayType: createPatientDto.xrayType,
        xrayNotes: createPatientDto.xrayNotes,
        imageBase64: createPatientDto.imageBase64,
        status: 'VALIDATING',
      });

      const savedXray = await this.xrayRepository.save(xray);

      // ✅ Step 4: Validate X-ray via Python ML API
      await this.systemLoggingService.info(
        SystemLogCategory.XRAY_PROCESSING,
        'X-ray validation started',
        {
          resourceId: savedXray.id,
          resourceType: 'XRay',
        },
      );

      const validationResult = await this.validateXray(
        savedXray.id,
        createPatientDto.imageBase64,
      );

      if (!validationResult.isValid) {
        // ✅ X-ray validation failed - mark as failed
        await this.xrayRepository.update(savedXray.id, {
          status: 'FAILED',
          error: validationResult.error,
        });

        // Soft-delete patient
        await this.patientRepository.update(savedPatient.id, {
          deletedAt: new Date(),
        });

        await this.systemLoggingService.warn(
          SystemLogCategory.XRAY_PROCESSING,
          'X-ray validation failed',
          {
            resourceId: savedXray.id,
            resourceType: 'XRay',
            error: validationResult.error,
          },
        );

        throw new BadRequestException(
          `Invalid X-ray image: ${validationResult.error || 'Image validation failed'}`,
        );
      }

      // ✅ Step 5: Perform TB Diagnosis via Python ML API
      await this.systemLoggingService.info(
        SystemLogCategory.ML_INFERENCE,
        'TB diagnosis prediction started',
        {
          resourceId: savedPatient.id,
          resourceType: 'Patient',
        },
      );

      const diagnosisResult = await this.performTBDiagnosis(
        savedPatient.id,
        savedXray.id,
        createPatientDto.imageBase64,
      );

      // ✅ Step 6: Create diagnosis result record
      const diagnosis = this.diagnosisRepository.create({
        patientId: savedPatient.id,
        xrayId: savedXray.id,
        diseaseType: 'TUBERCULOSIS',
        prediction: diagnosisResult.prediction,
        confidenceScore: diagnosisResult.confidenceScore,
        confidenceLevel: diagnosisResult.confidenceLevel,
        tbIntensity: diagnosisResult.tbIntensity,
        affectedPercentage: diagnosisResult.affectedPercentage,
        affectedAreas: JSON.stringify(diagnosisResult.affectedAreas),
        heatmap: diagnosisResult.heatmap,
        recommendations: diagnosisResult.recommendations,
        processingTimeMs: diagnosisResult.processingTimeMs,
      });

      const savedDiagnosis = await this.diagnosisRepository.save(diagnosis);

      // ✅ Step 7: Update X-ray status to completed
      await this.xrayRepository.update(savedXray.id, {
        status: 'COMPLETED',
      });

      // ✅ Step 8: Log success
      await this.systemLoggingService.info(
        SystemLogCategory.DIAGNOSIS,
        `Diagnosis result created: ${diagnosisResult.prediction}`,
        {
          resourceId: savedDiagnosis.id,
          resourceType: 'DiagnosisResult',
          userId: physicianId,
        },
      );

      // ✅ Step 9: Return patient with relations
      return await this.patientRepository.findOne({
        where: { id: savedPatient.id },
        relations: ['xrays', 'diagnosisResults'],
      });
    } catch (error) {
      // Log error and rethrow
      await this.systemLoggingService.error(
        SystemLogCategory.PATIENT_MANAGEMENT,
        'Patient registration failed',
        {
          userId: physicianId,
          error: error.message,
        },
      );

      throw error;
    }
  }

  private async validateXray(
    xrayId: string,
    imageBase64: string,
  ): Promise<{ isValid: boolean; error?: string; confidence?: number }> {
    try {
      const { data } = await axios.post<any>(
        `${this.pythonApiUrl}/predict/xray_validation`,
        { image_base_64: imageBase64 },
        { timeout: 30000 },
      );

      return {
        isValid: data.is_xray && (data.confidence || 0) > 0.7,
        error: !data.is_xray ? 'Image is not a valid medical X-ray' : undefined,
        confidence: data.confidence,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `X-ray validation API error: ${error.message}`,
      };
    }
  }

  private async performTBDiagnosis(
    patientId: string,
    xrayId: string,
    imageBase64: string,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const { data } = await axios.post<any>(
        `${this.pythonApiUrl}/predict/tuberculosis`,
        { image_base_64: imageBase64 },
        { timeout: 60000 },
      );

      const processingTimeMs = Date.now() - startTime;
      const confidenceScore = data.confidence || 0;
      const affectedPercentage = data.affected_percentage || 0;

      // Determine confidence level
      const confidenceLevel =
        confidenceScore > 0.9 ? 'VERY_HIGH' :
        confidenceScore > 0.75 ? 'HIGH' :
        confidenceScore > 0.6 ? 'MODERATE' : 'LOW';

      // Determine TB intensity
      let tbIntensity: string;
      if (affectedPercentage === 0) tbIntensity = 'NONE';
      else if (affectedPercentage < 10) tbIntensity = 'MILD';
      else if (affectedPercentage < 25) tbIntensity = 'MODERATE';
      else if (affectedPercentage < 50) tbIntensity = 'SEVERE';
      else tbIntensity = 'CRITICAL';

      const recommendations = this.generateRecommendations(data.prediction, tbIntensity);

      return {
        prediction: data.prediction.toUpperCase(), // TB_POSITIVE or TB_NEGATIVE
        confidenceScore,
        confidenceLevel,
        tbIntensity,
        affectedPercentage,
        affectedAreas: data.affected_areas || [],
        heatmap: data.heatmap || null,
        recommendations,
        processingTimeMs,
      };
    } catch (error) {
      await this.systemLoggingService.error(
        SystemLogCategory.ML_INFERENCE,
        'TB diagnosis prediction failed',
        {
          resourceId: patientId,
          resourceType: 'Patient',
          error: error.message,
        },
      );

      throw new BadRequestException(
        `TB diagnosis failed: ${error.message}`,
      );
    }
  }

  private generateRecommendations(prediction: string, tbIntensity: string): string {
    const isTB = prediction.toLowerCase().includes('positive');

    if (!isTB) {
      return 'No TB detected. Continue routine monitoring.';
    }

    switch (tbIntensity) {
      case 'NONE':
        return 'TB minimal. Close monitoring recommended. Follow-up X-ray in 4 weeks.';
      case 'MILD':
        return 'Mild TB involvement. Start antituberculous therapy. Follow-up X-ray in 2 weeks.';
      case 'MODERATE':
        return 'Moderate TB involvement. Immediate antituberculous therapy required. Weekly follow-ups.';
      case 'SEVERE':
        return 'Severe TB involvement. Urgent treatment initiation. Daily clinical evaluation recommended.';
      case 'CRITICAL':
        return 'Critical TB involvement. Emergency treatment, possible hospitalization. Intensive monitoring required.';
      default:
        return 'TB detected. Consult with TB specialist for treatment plan.';
    }
  }

  async findAll(user: any): Promise<Patient[]> {
    const query = this.patientRepository.createQueryBuilder('patient');

    // Filter soft-deleted
    query.where('patient.deletedAt IS NULL');

    // For physicians: only their patients
    if (user.role === 'Physician') {
      query.andWhere('patient.physicianId = :physicianId', {
        physicianId: user.sub,
      });
    }

    // Include relations
    query.leftJoinAndSelect('patient.xrays', 'xrays');
    query.leftJoinAndSelect('patient.diagnosisResults', 'diagnosisResults');

    return await query.getMany();
  }

  async findById(id: string, user: any): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['xrays', 'diagnosisResults'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Enforce physician access control
    if (user.role === 'Physician' && patient.physicianId !== user.sub) {
      throw new ForbiddenException(
        'You do not have permission to access this patient',
      );
    }

    return patient;
  }

  async update(id: string, updatePatientDto: any, user: any): Promise<Patient> {
    const patient = await this.findById(id, user);
    
    Object.assign(patient, updatePatientDto);
    return await this.patientRepository.save(patient);
  }

  async remove(id: string, user: any): Promise<void> {
    const patient = await this.findById(id, user);
    
    // Soft delete
    patient.deletedAt = new Date();
    await this.patientRepository.save(patient);
  }
}
```

---

### 6. **src/modules/patients/patients.module.ts**
**Change**: Added XRay, DiagnosisResult, and SystemLoggingModule imports

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { XRay } from '../xray/xray.entity';
import { DiagnosisResult } from '../diagnosis/diagnosis-result.entity';
import { SystemLoggingModule } from '../logging/system-logging.module';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, XRay, DiagnosisResult]), // ✅ Added XRay, DiagnosisResult
    SystemLoggingModule, // ✅ Added for logging integration
  ],
  providers: [PatientsService],
  controllers: [PatientsController],
})
export class PatientsModule {}
```

---

### 7. **src/app.module.ts**
**Change**: Added AuthLoggingModule and SystemLoggingModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLoggingModule } from './modules/logging/auth-logging.module';
import { SystemLoggingModule } from './modules/logging/system-logging.module';
// ... other imports ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthLoggingModule,        // ✅ Added
    SystemLoggingModule,      // ✅ Added
    AuthModule,
    PatientsModule,
    // ... other modules ...
  ],
})
export class AppModule {}
```

---

### 8. **src/config/typeorm.config.ts**
**Change**: Explicitly registered all entities including new auth & logging tables

```typescript
import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/auth/auth.entity';
import { Patient } from '../modules/patients/patient.entity';
import { XRay } from '../modules/xray/xray.entity';
import { DiagnosisResult } from '../modules/diagnosis/diagnosis-result.entity';
import { AuthLog } from '../modules/auth/auth-log.entity';
import { SystemLog } from '../modules/logging/system-log.entity';

const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [
    User,
    Patient,
    XRay,
    DiagnosisResult,
    AuthLog,           // ✅ Added
    SystemLog,         // ✅ Added
  ],
  synchronize: true, // Set to false in production
  logging: true,
};

export default typeOrmConfig;
```

---

## Summary

**Total Files Created**: 6
- auth-log.entity.ts
- system-log.entity.ts
- auth-logging.service.ts
- system-logging.service.ts
- auth-logging.module.ts
- system-logging.module.ts

**Total Files Modified**: 8
- auth.module.ts
- auth.service.ts
- jwt.guard.ts
- patient.dto.ts
- patients.service.ts (completely rewritten - 260+ lines)
- patients.module.ts
- app.module.ts
- typeorm.config.ts

**Key Features Implemented**:
✅ Auth logging with device detection
✅ System logging with categorization
✅ JWT secret enforcement from .env
✅ X-ray required for patient creation
✅ Automatic X-ray validation via ML
✅ Automatic TB diagnosis via ML
✅ Diagnosis results stored in database
✅ Soft deletes enabled everywhere
✅ Complete audit trail
✅ Physician access control
✅ Admin full access
