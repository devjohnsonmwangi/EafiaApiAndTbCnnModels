import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import {
  DiseaseType,
  ConfidenceLevel,
  TBIntensity,
} from './diagnosis-result.entity';

export class CreateDiagnosisResultDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  xrayId!: string;

  @IsEnum(DiseaseType)
  diseaseType!: DiseaseType;

  @IsString()
  prediction!: string;

  @IsNumber()
  confidenceScore!: number;

  @IsEnum(ConfidenceLevel)
  confidenceLevel!: ConfidenceLevel;

  @IsOptional()
  @IsEnum(TBIntensity)
  tbIntensity?: TBIntensity;

  @IsOptional()
  @IsString()
  affectedAreas?: string;

  @IsOptional()
  @IsNumber()
  affectedPercentage?: number;

  @IsOptional()
  @IsString()
  heatmapBase64?: string;

  @IsOptional()
  @IsString()
  clinicalFindings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsNumber()
  processingTimeMs?: number;
}

export class DiagnosisResultResponseDto {
  id!: string;
  patientId!: string;
  xrayId!: string;
  diseaseType!: string;
  prediction!: string;
  confidenceScore!: number;
  confidenceLevel!: string;
  tbIntensity!: string;
  affectedAreas?: string | null;
  affectedPercentage?: number | null;
  heatmapBase64?: string | null;
  clinicalFindings?: string | null;
  recommendations?: string | null;
  modelName?: string | null;
  processingTimeMs?: number | null;
  deviceIpAddress?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class DiagnosisWithXRayDto extends DiagnosisResultResponseDto {
  xray!: {
    id: string;
    fileName: string;
    xrayType: string;
  };
  patient!: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
