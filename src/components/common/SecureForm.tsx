import React from 'react';
import { z } from 'zod';
import { useSecureForm } from '@/hooks/useSecureForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';

interface SecureFormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'number';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

const SecureFormField: React.FC<SecureFormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  disabled,
  value,
  error,
  onChange,
  onBlur
}) => {
  const InputComponent = type === 'textarea' ? Textarea : Input;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}>
        {label}
      </Label>
      <InputComponent
        id={name}
        name={name}
        type={type !== 'textarea' ? type : undefined}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <div id={`${name}-error`} className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

interface SecureFormProps<T extends Record<string, any>> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  fields: Array<{
    name: keyof T;
    label: string;
    type?: 'text' | 'email' | 'password' | 'textarea' | 'number';
    placeholder?: string;
    required?: boolean;
  }>;
  submitLabel?: string;
  loadingLabel?: string;
  className?: string;
  rateLimitKey?: string;
  maxAttempts?: number;
  children?: React.ReactNode;
}

export function SecureForm<T extends Record<string, any>>({
  schema,
  onSubmit,
  fields,
  submitLabel = 'Enviar',
  loadingLabel = 'Enviando...',
  className = '',
  rateLimitKey,
  maxAttempts,
  children
}: SecureFormProps<T>) {
  const {
    data,
    errors,
    isLoading,
    setValue,
    handleSubmit,
    validateField
  } = useSecureForm({
    schema,
    onSubmit,
    rateLimitKey,
    maxAttempts
  });

  // Verificar se há erros globais
  const globalError = errors['_global'];

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      {globalError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {fields.map((field) => (
        <SecureFormField
          key={field.name as string}
          name={field.name as string}
          label={field.label}
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          disabled={isLoading}
          value={data[field.name]}
          error={errors[field.name as string]}
          onChange={(value) => setValue(field.name, value)}
          onBlur={() => validateField(field.name)}
        />
      ))}

      {children}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

// Exemplo de uso:
/*
const MyForm = () => {
  const handleSubmit = async (data: LoginData) => {
    // Lógica de envio
  };

  return (
    <SecureForm
      schema={LoginSchema}
      onSubmit={handleSubmit}
      fields={[
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Senha', type: 'password', required: true }
      ]}
      submitLabel="Entrar"
      rateLimitKey="login"
      maxAttempts={5}
    />
  );
};
*/