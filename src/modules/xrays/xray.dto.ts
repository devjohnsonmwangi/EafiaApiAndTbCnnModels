import { IsString, IsUUID, IsOptional, IsBase64 } from 'class-validator';

export class CreateXRayDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @IsBase64()
  imageBase64!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  xrayType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateXRayDto {
  @IsOptional()
  @IsString()
  xrayType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class XRayResponseDto {
  id!: string;
  patientId!: string;
  fileName!: string;
  fileType!: string;
  fileSizeBytes!: number;
  status!: string;
  xrayType!: string;
  notes!: string;
  isValid!: boolean;
  validationConfidence!: number;
  validationError!: string;
  deviceIpAddress!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class XRayWithPatientDto extends XRayResponseDto {
  patient!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
