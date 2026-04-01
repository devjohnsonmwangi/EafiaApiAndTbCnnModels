import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { XrayValidationService } from '../xray-validation/xray-validation.service';

export interface TbPredictionResult {
  prediction: string; // "Normal" or "Tuberculosis"
  confidence: number;
  heatmap?: string;
  model: string;
  validation_passed: boolean;
  validation_message: string;
}

/**
 * Interface for the expected response from the Python ML service
 */
interface PythonApiResponse {
  prediction: string;
  confidence: number;
  heatmap?: string;
  model?: string;
}

@Injectable()
export class TbPredictionService {
  // Use PYTHON_API_URL with fallback to ML_SERVICE_URL, then default
  private readonly pythonApiUrl =
    process.env.PYTHON_API_URL !== undefined &&
    process.env.PYTHON_API_URL !== ''
      ? process.env.PYTHON_API_URL
      : (process.env.ML_SERVICE_URL ?? 'http://localhost:5000');

  constructor(private readonly xrayValidation: XrayValidationService) {}

  /**
   * Predict TB from chest X-ray with validation
   */
  async predictTB(imageBase64: string): Promise<TbPredictionResult> {
    try {
      // Step 1: Validate X-ray image
      const validation = await this.xrayValidation.validateXray(imageBase64);

      if (!validation.is_valid) {
        return {
          prediction: 'INVALID_IMAGE',
          confidence: 0,
          model: 'tb_classifier_v1',
          validation_passed: false,
          validation_message: validation.message,
        };
      }

      // Step 2: Call Python API for TB prediction
      // Fix for no-explicit-any: Use generic typing for the axios call
      const { data } = await axios.post<PythonApiResponse>(
        `${this.pythonApiUrl}/predict/tuberculosis`,
        { image_base64: imageBase64 },
        { timeout: 30000 },
      );

      return {
        prediction: data.prediction,
        confidence: data.confidence,
        heatmap: data.heatmap,
        model: data.model ?? 'tb_classifier_v1',
        validation_passed: true,
        validation_message: 'X-ray validation passed successfully',
      };
    } catch (error) {
      console.error('TB prediction error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        prediction: 'ERROR',
        confidence: 0,
        model: 'tb_classifier_v1',
        validation_passed: false,
        validation_message: `Prediction service error: ${errorMessage}. Ensure Python ML service is running at ${this.pythonApiUrl}`,
      };
    }
  }

  /**
   * Validate and predict TB with file upload
   */
  async predictTBFromFile(fileBuffer: Buffer): Promise<TbPredictionResult> {
    try {
      // Convert file to base64
      const imageBase64 = fileBuffer.toString('base64');
      return await this.predictTB(imageBase64);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        prediction: 'ERROR',
        confidence: 0,
        model: 'tb_classifier_v1',
        validation_passed: false,
        validation_message: `File processing error: ${errorMessage}`,
      };
    }
  }
}
