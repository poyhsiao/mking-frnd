import { NextFunction, Request, Response } from 'express';
import { createError } from './errorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = validateData(req.body as Record<string, unknown>, rules);
    
    if (!result.isValid) {
      const error = createError('Validation failed', 422, true, 'VALIDATION_ERROR');
      error.details = { validation: result.errors };
      next(error);
      return;
    }
    
    next();
  };
};

export const validateData = (
  data: Record<string, unknown>,
  rules: ValidationRule[]
): ValidationResult => {
  const errors: Array<{ field: string; message: string; value?: unknown }> = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: `${rule.field} is required`,
        value,
      });
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({
              field: rule.field,
              message: `${rule.field} must be a string`,
              value,
            });
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
            errors.push({
              field: rule.field,
              message: `${rule.field} must be a number`,
              value,
            });
            continue;
          }
          break;
        case 'email':
          if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push({
              field: rule.field,
              message: `${rule.field} must be a valid email address`,
              value,
            });
            continue;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({
              field: rule.field,
              message: `${rule.field} must be a boolean`,
              value,
            });
            continue;
          }
          break;
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.minLength} characters long`,
          value,
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be no more than ${rule.maxLength} characters long`,
          value,
        });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} format is invalid`,
          value,
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: rule.field,
          message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`,
          value,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Common validation rules
export const commonRules = {
  email: {
    field: 'email',
    required: true,
    type: 'email' as const,
    maxLength: 255,
  },
  password: {
    field: 'password',
    required: true,
    type: 'string' as const,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  name: {
    field: 'name',
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  age: {
    field: 'age',
    required: false,
    type: 'number' as const,
    custom: (value: unknown): boolean | string => {
      const num = Number(value);
      return (num >= 13 && num <= 120) || 'Age must be between 13 and 120';
    },
  },
};