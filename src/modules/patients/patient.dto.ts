import {
  IsString,
  IsEmail,
  IsDateString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { XRay } from '../xrays/xray.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';

type MultipartFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

/**
 * CreatePatientDto with X-Ray data
 * ✅ X-ray image must be provided during patient creation for initial TB screening
 * ✅ X-ray data is extracted at service level for ML processing
 */
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
  dateOfBirth!: string;

  @IsEnum(['Male', 'Female', 'Other'])
  gender!: string;

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

  // ✅ X-RAY DATA - NOW OPTIONAL FOR PATIENT CREATION
  // Can be provided as either:
  // 1. Base64 encoded string (imageBase64)
  // 2. File upload (imageFile - will be converted to base64)
  // If not provided, diagnosis will be marked as PENDING
  @IsOptional()
  @IsString()
  imageBase64?: string; // Base64 encoded X-ray image - REQUIRED if imageFile not provided

  @IsOptional()
  imageFile?: MultipartFile; // File object from multipart/form-data upload

  @IsOptional()
  @IsString()
  fileName?: string; // Name of the X-ray file

  @IsOptional()
  @IsString()
  xrayType?: string; // Type of X-ray (e.g., "Chest PA", "Chest Lateral")

  @IsOptional()
  @IsString()
  xrayNotes?: string; // Notes about the X-ray
}

/**
 * DTO Validation Note:
 * - X-ray data NOT required - patient can be created without X-ray
 * - Optional imageBase64 OR imageFile can be provided for initial screening
 * - If no X-ray data provided, diagnosis will be created in PENDING status
 * - X-ray can be added later via UpdatePatientDto
 * - Supported image formats: JPEG, PNG, DICOM
 */

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

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

  // ✅ X-RAY DATA - OPTIONAL FOR PATIENT UPDATE
  // Allow updating patient with X-ray data if it failed initially
  @IsOptional()
  @IsString()
  imageBase64?: string; // Base64 encoded X-ray image

  @IsOptional()
  imageFile?: MultipartFile; // File object from multipart/form-data upload

  @IsOptional()
  @IsString()
  fileName?: string; // Name of the X-ray file

  @IsOptional()
  @IsString()
  xrayType?: string; // Type of X-ray (e.g., "Chest PA", "Chest Lateral")

  @IsOptional()
  @IsString()
  xrayNotes?: string; // Notes about the X-ray
}

export class PatientResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phone!: string;
  dateOfBirth!: Date;
  gender!: string;
  medicalHistory!: string;
  allergies!: string;
  medications!: string;
  address!: string;
  city!: string;
  state!: string;
  postalCode!: string;
  country!: string;
  physicianId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  // X-ray and diagnosis data populated from relations
  xrays?: XRay[];
  diagnosisResults?: DiagnosisResult[];
}
