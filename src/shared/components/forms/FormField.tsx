/**
 * Form Field Component with Inline Validation
 * Provides consistent form input with real-time validation feedback
 */

import { AlertCircle } from 'lucide-react';
import type { FC } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

export type ValidationRule = 'required' | 'email' | 'url' | 'minLength' | 'maxLength' | 'pattern';

export interface ValidationRuleConfig {
  type: ValidationRule;
  value?: number | RegExp;
  message: string;
}

export interface FormFieldProps {
  // Basic props
  id: string;
  label: string;
  type?: 'text' | 'email' | 'url' | 'password' | 'number' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;

  // Validation props
  validationRules?: ValidationRuleConfig[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (isValid: boolean) => void;

  // UI props
  className?: string;
  textareaRows?: number;
  helperText?: string;

  // Additional props
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  inputRef?: React.RefObject<HTMLInputElement | null>;

  // Accessibility props
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

interface ValidationError {
  message: string;
  timestamp: number;
}

/**
 * Form Field Component
 *
 * Features:
 * - Field-level error display with error message
 * - Required field validation
 * - Min/max length validation
 * - Pattern matching (email, URL)
 * - Real-time validation on input (onBlur, onChange)
 * - Accessible error display (aria-describedby)
 * - Clear validation on valid input
 *
 * @example
 * ```tsx
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   validationRules={[
 *     { type: 'required', message: 'Email is required' },
 *     { type: 'email', message: 'Please enter a valid email' },
 *   ]}
 *   required
 * />
 * ```
 */
export const FormField: FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  validationRules = [],
  validateOnChange = false,
  validateOnBlur = true,
  onValidationChange,
  className,
  textareaRows = 3,
  helperText,
  onKeyDown,
  textareaRef: externalTextareaRef,
  inputRef: externalInputRef,
  'aria-describedby': ariaDescribedby,
  'aria-required': ariaRequired,
}) => {
  const [error, setError] = useState<ValidationError | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const errorId = `${id}-error`;
  const internalFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Use external ref if provided, otherwise use internal ref
  const fieldRef =
    type === 'textarea'
      ? (externalTextareaRef ?? internalFieldRef)
      : (externalInputRef ?? internalFieldRef);

  /**
   * Validate field value against rules
   */
  const validateField = useCallback(
    (fieldValue: string): ValidationError | null => {
      // Check all validation rules
      for (const rule of validationRules) {
        switch (rule.type) {
          case 'required':
            if (!fieldValue.trim()) {
              return { message: rule.message, timestamp: Date.now() };
            }
            break;

          case 'email':
            if (fieldValue.trim()) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(fieldValue)) {
                return { message: rule.message, timestamp: Date.now() };
              }
            }
            break;

          case 'url':
            if (fieldValue.trim()) {
              try {
                new URL(fieldValue);
              } catch {
                return { message: rule.message, timestamp: Date.now() };
              }
            }
            break;

          case 'minLength':
            if (typeof rule.value === 'number' && fieldValue.length < rule.value) {
              return { message: rule.message, timestamp: Date.now() };
            }
            break;

          case 'maxLength':
            if (typeof rule.value === 'number' && fieldValue.length > rule.value) {
              return { message: rule.message, timestamp: Date.now() };
            }
            break;

          case 'pattern':
            if (rule.value instanceof RegExp && fieldValue.trim()) {
              if (!rule.value.test(fieldValue)) {
                return { message: rule.message, timestamp: Date.now() };
              }
            }
            break;
        }
      }

      // No errors
      return null;
    },
    [validationRules],
  );

  /**
   * Handle input change with optional validation
   */
  const handleChange = useCallback(
    (newValue: string): void => {
      onChange(newValue);

      // Clear error immediately when user types
      if (error && newValue !== value) {
        setError(null);
        onValidationChange?.(true);
      }

      // Optional: validate on change if enabled
      if (validateOnChange && hasBlurred) {
        const validationError = validateField(newValue);
        if (validationError) {
          setError(validationError);
          onValidationChange?.(false);
        } else {
          setError(null);
          onValidationChange?.(true);
        }
      }
    },
    [value, error, hasBlurred, validateOnChange, validateField, onChange, onValidationChange],
  );

  /**
   * Handle blur event for validation
   */
  const handleBlur = useCallback((): void => {
    setHasBlurred(true);

    // Validate on blur if enabled
    if (validateOnBlur) {
      const validationError = validateField(value);
      if (validationError) {
        setError(validationError);
        onValidationChange?.(false);
      } else {
        setError(null);
        onValidationChange?.(true);
      }
    }
  }, [validateOnBlur, validateField, value, onValidationChange]);

  /**
   * Get aria-describedby for accessibility
   */
  const getAriaDescribedBy = (): string => {
    const describedBy: string[] = [];

    if (error) {
      describedBy.push(errorId);
    }

    if (ariaDescribedby) {
      describedBy.push(ariaDescribedby);
    }

    return describedBy.join(' ');
  };

  /**
   * Clear validation on valid input
   */
  useEffect(() => {
    if (error && hasBlurred) {
      const newError = validateField(value);
      if (!newError) {
        setError(null);
        onValidationChange?.(true);
      }
    }
  }, [value, error, hasBlurred, validateField, onValidationChange]);

  const hasError = error !== null;
  const showError = hasError && hasBlurred;

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      <label htmlFor={id} className='block text-sm font-medium text-foreground'>
        {label}
        {required && (
          <span className='ml-1 text-destructive' aria-label='required'>
            *
          </span>
        )}
      </label>

      {/* Input Field */}
      {type === 'textarea' ? (
        <textarea
          ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          id={id}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={textareaRows}
          className={cn(
            'w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm',
            'focus:border-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            showError
              ? 'border-destructive focus:ring-destructive'
              : 'border-border focus:border-primary',
          )}
          aria-invalid={showError}
          aria-describedby={getAriaDescribedBy()}
          aria-required={ariaRequired ?? required}
        />
      ) : (
        <input
          ref={fieldRef as React.RefObject<HTMLInputElement>}
          id={id}
          type={type}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2 text-sm',
            'focus:border-transparent focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            showError
              ? 'border-destructive focus:ring-destructive'
              : 'border-border focus:border-primary',
          )}
          aria-invalid={showError}
          aria-describedby={getAriaDescribedBy()}
          aria-required={ariaRequired ?? required}
        />
      )}

      {/* Helper Text */}
      {!showError && helperText && <p className='text-xs text-muted-foreground'>{helperText}</p>}

      {/* Error Message */}
      {showError && (
        <p
          id={errorId}
          className='flex items-center gap-1.5 text-xs font-medium text-destructive'
          role='alert'
          aria-live='polite'
        >
          <AlertCircle className='h-3.5 w-3.5 flex-shrink-0' aria-hidden='true' />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
