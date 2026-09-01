/**
 * Enhanced Form Validation System
 * Production-level form validation with comprehensive user feedback
 * 
 * Features:
 * - Real-time validation with debouncing
 * - Field-level error messages
 * - Form-level validation summaries
 * - Progressive validation strategy
 * - Accessibility-compliant error handling
 * - Custom validation rules
 * - Async validation support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedInput, EnhancedAlert, EnhancedButton } from '../ui/enhancedComponents';

// Common validation schemas
export const commonSchemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine(val => !val.includes('+'), 'Email aliases not allowed'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  price: z.string()
    .min(1, 'Price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .refine(val => parseFloat(val) > 0, 'Price must be greater than 0'),
  
  quantity: z.string()
    .min(1, 'Quantity is required')
    .regex(/^\d+$/, 'Quantity must be a whole number')
    .refine(val => parseInt(val) > 0, 'Quantity must be greater than 0'),
  
  url: z.string()
    .url('Invalid URL format')
    .refine(val => val.startsWith('http://') || val.startsWith('https://'), 'URL must start with http:// or https://'),
  
  date: z.string()
    .min(1, 'Date is required')
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date format'),
  
  required: z.string()
    .min(1, 'This field is required')
    .max(500, 'Field must not exceed 500 characters'),
  
  optional: z.string()
    .max(500, 'Field must not exceed 500 characters')
    .optional()
};

// Form field configuration
export const createFieldConfig = (schema, options = {}) => ({
  schema,
  label: options.label || '',
  placeholder: options.placeholder || '',
  helper: options.helper || '',
  icon: options.icon || null,
  disabled: options.disabled || false,
  className: options.className || '',
  asyncValidation: options.asyncValidation || null,
  dependencies: options.dependencies || []
});

// Enhanced form component
export const EnhancedForm = ({
  schema,
  fields,
  onSubmit,
  defaultValues = {},
  submitButton = { text: 'Submit', variant: 'primary' },
  showProgress = true,
  progressiveValidation = true,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [formErrors, setFormErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    trigger,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: progressiveValidation ? 'onChange' : 'onSubmit'
  });

  // Watch for field changes to trigger dependent validations
  useEffect(() => {
    if (progressiveValidation) {
      const subscription = watch((value, { name, type }) => {
        if (type === 'change' && fields[name]?.dependencies) {
          fields[name].dependencies.forEach(depField => {
            trigger(depField);
          });
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, fields, progressiveValidation, trigger]);

  // Calculate form completion progress
  const calculateProgress = useCallback(() => {
    const totalFields = Object.keys(fields).length;
    const completedFields = Object.keys(defaultValues).filter(
      key => defaultValues[key] && defaultValues[key].length > 0
    ).length;
    return Math.round((completedFields / totalFields) * 100);
  }, [fields, defaultValues]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setFormErrors([]);
    setSubmitCount(prev => prev + 1);

    try {
      // Run async validations if any
      const hasAsyncValidation = Object.values(fields).some(field => field.asyncValidation);
      if (hasAsyncValidation) {
        setIsValidating(true);
        const asyncValidationPromises = Object.entries(fields)
          .filter(([_, field]) => field.asyncValidation)
          .map(async ([fieldName, field]) => {
            try {
              await field.asyncValidation(data[fieldName], data);
              return { field: fieldName, valid: true };
            } catch (error) {
              return { field: fieldName, valid: false, error: error.message };
            }
          });

        const asyncResults = await Promise.all(asyncValidationPromises);
        const asyncErrors = asyncResults.filter(result => !result.valid);

        if (asyncErrors.length > 0) {
          setFormErrors(asyncErrors.map(err => err.error));
          setIsValidating(false);
          setIsSubmitting(false);
          return;
        }
      }

      setIsValidating(false);
      await onSubmit(data);
    } catch (error) {
      setFormErrors([error.message || 'An unexpected error occurred']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Form Completion</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Form Errors */}
      <AnimatePresence>
        {formErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EnhancedAlert variant="danger" dismissible onDismiss={() => setFormErrors([])}>
              <div className="font-medium mb-2">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {formErrors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </EnhancedAlert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields */}
      {Object.entries(fields).map(([fieldName, fieldConfig]) => (
        <Controller
          key={fieldName}
          name={fieldName}
          control={control}
          render={({ field: controllerField }) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: fieldName.charCodeAt(0) * 0.01 }}
            >
              <EnhancedInput
                value={controllerField.value}
                onChange={controllerField.onChange}
                onBlur={controllerField.onBlur}
                ref={controllerField.ref}
                label={fieldConfig.label}
                error={errors[fieldName]?.message}
                helper={fieldConfig.helper}
                icon={fieldConfig.icon}
                disabled={fieldConfig.disabled || isSubmitting}
                placeholder={fieldConfig.placeholder}
                className={fieldConfig.className}
              />
            </motion.div>
          )}
        />
      ))}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <EnhancedButton
          type="submit"
          variant={submitButton.variant}
          loading={isSubmitting || isValidating}
          disabled={!isDirty || (progressiveValidation && !isValid)}
          className="w-full"
        >
          {submitButton.text}
        </EnhancedButton>
      </motion.div>

      {/* Form Status */}
      {submitCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500 mt-4"
        >
          {isSubmitting ? 'Validating and submitting...' : 'Form ready'}
        </motion.div>
      )}
    </form>
  );
};

// Password strength indicator
export const PasswordStrengthIndicator = ({ password }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setFeedback([]);
      return;
    }

    let score = 0;
    const checks = [];

    // Length check
    if (password.length >= 8) {
      score += 1;
      checks.push({ valid: true, message: 'At least 8 characters' });
    } else {
      checks.push({ valid: false, message: 'At least 8 characters' });
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
      checks.push({ valid: true, message: 'Contains uppercase letter' });
    } else {
      checks.push({ valid: false, message: 'Contains uppercase letter' });
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
      checks.push({ valid: true, message: 'Contains lowercase letter' });
    } else {
      checks.push({ valid: false, message: 'Contains lowercase letter' });
    }

    // Number check
    if (/[0-9]/.test(password)) {
      score += 1;
      checks.push({ valid: true, message: 'Contains number' });
    } else {
      checks.push({ valid: false, message: 'Contains number' });
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
      checks.push({ valid: true, message: 'Contains special character' });
    } else {
      checks.push({ valid: false, message: 'Contains special character' });
    }

    setStrength((score / 5) * 100);
    setFeedback(checks);
  }, [password]);

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Password Strength</span>
        <span className={`text-sm font-medium ${
          strength < 40 ? 'text-red-600' :
          strength < 60 ? 'text-yellow-600' :
          strength < 80 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          className={`h-2 rounded-full transition-colors ${
            strength < 40 ? 'bg-red-500' :
            strength < 60 ? 'bg-yellow-500' :
            strength < 80 ? 'bg-blue-500' : 'bg-green-500'
          }`}
        />
      </div>

      <div className="space-y-1">
        {feedback.map((check, index) => (
          <motion.div
            key={`check-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center text-sm ${
              check.valid ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className="mr-2">{check.valid ? '✓' : '○'}</span>
            {check.message}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Field-level validation feedback
export const FieldValidationFeedback = ({ errors, _touched }) => {
  return (
    <AnimatePresence>
      {errors && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-red-500 text-sm mt-1 flex items-start"
        >
          <span className="mr-1">⚠</span>
          <span>{typeof errors === 'string' ? errors : errors.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Async validation wrapper
export const withAsyncValidation = (validationFn, debounceMs = 500) => {
  let timeoutId;
  
  return async (value, formData) => {
    clearTimeout(timeoutId);
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          await validationFn(value, formData);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
    });
  };
};

export default {
  EnhancedForm,
  commonSchemas,
  createFieldConfig,
  PasswordStrengthIndicator,
  FieldValidationFeedback,
  withAsyncValidation
};