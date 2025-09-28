import { useState, useCallback } from 'react';
import { z } from 'zod';
import { validateAndSanitize, frontendRateLimit } from '@/lib/validation';
import { toast } from 'sonner';

interface UseSecureFormOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  rateLimitKey?: string;
  maxAttempts?: number;
  windowMs?: number;
}

interface UseSecureFormReturn<T> {
  data: Partial<T>;
  errors: Record<string, string>;
  isLoading: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setData: (data: Partial<T>) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  validateField: (field: keyof T) => void;
  clearError: (field: keyof T) => void;
}

export function useSecureForm<T extends Record<string, any>>({
  schema,
  onSubmit,
  rateLimitKey,
  maxAttempts = 5,
  windowMs = 60000
}: UseSecureFormOptions<T>): UseSecureFormReturn<T> {
  const [data, setDataState] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o formulário é válido
  const isValid = Object.keys(errors).length === 0 && Object.keys(data).length > 0;

  const setValue = useCallback((field: keyof T, value: any) => {
    setDataState(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário digita
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setData = useCallback((newData: Partial<T>) => {
    setDataState(newData);
    setErrors({}); // Limpar todos os erros
  }, []);

  const validateField = useCallback((field: keyof T) => {
    try {
      const fieldValue = data[field];
      
      // Validar o valor do campo diretamente
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        // Tentar validar o objeto completo e capturar apenas erros deste campo
        schema.parse(data);
      }
      
      // Se chegou aqui, não há erro para este campo
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(field as string));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: fieldError.message
          }));
        }
      }
    }
  }, [data, schema]);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Rate limiting no frontend
    if (rateLimitKey && !frontendRateLimit.checkLimit(rateLimitKey, maxAttempts, windowMs)) {
      toast.error('Muitas tentativas. Aguarde um momento antes de tentar novamente.');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Validar dados com schema
      const validatedData = validateAndSanitize(schema, data);
      
      // Executar callback de submit
      await onSubmit(validatedData);
      
      // Reset rate limit em caso de sucesso
      if (rateLimitKey) {
        frontendRateLimit.reset(rateLimitKey);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error instanceof z.ZodError) {
        // Erros de validação
        const formErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          formErrors[path] = err.message;
        });
        setErrors(formErrors);
      } else if (error instanceof Error) {
        // Outros erros
        toast.error(error.message || 'Erro ao enviar formulário');
      } else {
        toast.error('Erro desconhecido ao enviar formulário');
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, schema, onSubmit, rateLimitKey, maxAttempts, windowMs]);

  const reset = useCallback(() => {
    setDataState({});
    setErrors({});
    setIsLoading(false);
  }, []);

  return {
    data,
    errors,
    isLoading,
    isValid,
    setValue,
    setData,
    handleSubmit,
    reset,
    validateField,
    clearError
  };
}