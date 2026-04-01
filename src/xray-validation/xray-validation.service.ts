import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface XrayValidationResult {
  is_valid: boolean;
  is_xray: boolean;
  prediction: string;
  confidence: number;
  heatmap_base64?: string;
  message: string;
}

@Injectable()
export class XrayValidationService {
  private pythonApiUrl =
    process.env.PYTHON_API_URL ??
    process.env.ML_SERVICE_URL ??
    'http://localhost:5000';

  /**
   * Validate if the provided base64 image is a valid X-ray
   * @param imageBase64 Base64 encoded image string
   * @returns Validation result with confidence score
   */
  async validateXray(imageBase64: string): Promise<XrayValidationResult> {
    try {
      if (!imageBase64 || imageBase64.trim() === '') {
        return {
          is_valid: false,
          is_xray: false,
          prediction: 'No Image',
          confidence: 0,
          message:
            'No image data provided. Please provide a valid base64 encoded X-ray image.',
        };
      }

      // Call Python API for X-ray validation
      interface PythonValidationResponse {
        is_xray: boolean;
        confidence: number;
        prediction: string;
        heatmap_base64?: string;
      }

      const response = await axios.post<PythonValidationResponse>(
        `${this.pythonApiUrl}/predict/xray_validation`,
        { image_base64: imageBase64 },
        { timeout: 30000 },
      );

      const data = response.data;

      // Check if it's a valid X-ray with confidence > 70%
      const isValid = data.is_xray && data.confidence > 0.7;

      return {
        is_valid: isValid,
        is_xray: data.is_xray,
        prediction: data.prediction,
        confidence: data.confidence,
        heatmap_base64: data.heatmap_base64,
        message: isValid
          ? 'Valid X-ray image. Proceeding to TB detection...'
          : `Invalid X-ray image detected. Please provide a valid chest X-ray image. (Confidence: ${(
              data.confidence * 100
            ).toFixed(2)}%)`,
      };
    } catch (error) {
      console.error('X-ray validation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        is_valid: false,
        is_xray: false,
        prediction: 'Error',
        confidence: 0,
        message: `Validation service error: ${errorMessage}. Please ensure the Python ML service is running at ${this.pythonApiUrl}`,
      };
    }
  }
}
