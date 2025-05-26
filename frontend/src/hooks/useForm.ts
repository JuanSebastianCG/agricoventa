import { useState, ChangeEvent, FormEvent } from 'react';

interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T, event: FormEvent<HTMLFormElement>) => void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  resetForm: () => void;
}

/**
 * A custom hook for managing form state and validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: FormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle special input types
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setValues({
      ...values,
      [name]: parsedValue,
    });
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
    
    if (validate) {
      validateForm();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const touchedFields = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);
    
    setTouched(touchedFields);
    
    const isValidForm = validateForm();
    if (isValidForm) {
      setIsSubmitting(true);
      
      try {
        onSubmit(values, e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const setFieldValue = (field: keyof T, value: any) => {
    setValues({
      ...values,
      [field]: value,
    });
  };

  const setFieldTouched = (field: keyof T, isTouched = true) => {
    setTouched({
      ...touched,
      [field]: isTouched,
    });
    
    if (validate) {
      validateForm();
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    resetForm,
  };
}

// Mantener la exportación por defecto para compatibilidad con código existente
export default useForm; 