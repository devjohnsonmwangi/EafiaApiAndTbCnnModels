import { IsString, IsNotEmpty } from 'class-validator';

export class ImageInputDto {
  @IsString()
  @IsNotEmpty()
  image_base64!: string;
}

export class XrayValidationResponseDto {
  is_valid: boolean = false;
  is_xray: boolean = false;
  prediction!: string;
  confidence!: number;
  heatmap_base64?: string;
  message: string = '';
}

export class TbPredictionResponseDto {
  prediction!: string;
  confidence!: number;
  heatmap?: string;
  model!: string;
  validation_passed!: boolean;
  validation_message!: string;
}
