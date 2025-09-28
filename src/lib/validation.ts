import { z } from 'zod';

// Schemas de validação robusta para inputs críticos

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter pelo menos 6 caracteres" })
    .max(128, { message: "Senha muito longa" }),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: "Nome deve conter apenas letras e espaços" }),
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .max(128, { message: "Senha muito longa" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Senha deve conter pelo menos uma letra minúscula, maiúscula e um número" 
    }),
});

export const CommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Comentário não pode estar vazio" })
    .max(1000, { message: "Comentário muito longo" }),
  report_id: z
    .number()
    .int()
    .positive({ message: "ID do relatório inválido" }),
  parent_id: z
    .number()
    .int()
    .positive()
    .optional(),
});

export const ReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Título deve ter pelo menos 5 caracteres" })
    .max(200, { message: "Título muito longo" }),
  content: z
    .string()
    .trim()
    .min(10, { message: "Conteúdo deve ter pelo menos 10 caracteres" })
    .max(5000, { message: "Conteúdo muito longo" }),
  location_id: z
    .number()
    .int()
    .positive()
    .optional(),
  custom_location: z
    .string()
    .trim()
    .max(200, { message: "Localização muito longa" })
    .optional(),
  fish_species: z
    .string()
    .trim()
    .max(100, { message: "Espécie muito longa" })
    .optional(),
  fish_weight: z
    .number()
    .positive({ message: "Peso deve ser positivo" })
    .max(1000, { message: "Peso muito alto" })
    .optional(),
  weather_conditions: z
    .string()
    .trim()
    .max(200, { message: "Condições climáticas muito longas" })
    .optional(),
  water_conditions: z
    .string()
    .trim()
    .max(200, { message: "Condições da água muito longas" })
    .optional(),
  bait_used: z
    .string()
    .trim()
    .max(200, { message: "Isca muito longa" })
    .optional(),
  technique_used: z
    .string()
    .trim()
    .max(200, { message: "Técnica muito longa" })
    .optional(),
  fishing_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" })
    .optional(),
  fishing_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "Horário inválido" })
    .optional(),
  is_public: z.boolean().optional(),
  images: z
    .array(z.string().url({ message: "URL de imagem inválida" }))
    .max(10, { message: "Máximo 10 imagens" })
    .optional(),
});

export const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" }),
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" }),
  subject: z
    .string()
    .trim()
    .min(5, { message: "Assunto deve ter pelo menos 5 caracteres" })
    .max(200, { message: "Assunto muito longo" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Mensagem deve ter pelo menos 10 caracteres" })
    .max(2000, { message: "Mensagem muito longa" }),
});

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome muito longo" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: "Nome deve conter apenas letras e espaços" }),
  bio: z
    .string()
    .trim()
    .max(500, { message: "Bio muito longa" })
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, { message: "Localização muito longa" })
    .optional(),
});

export const PasswordChangeSchema = z.object({
  current_password: z
    .string()
    .min(1, { message: "Senha atual é obrigatória" }),
  new_password: z
    .string()
    .min(8, { message: "Nova senha deve ter pelo menos 8 caracteres" })
    .max(128, { message: "Nova senha muito longa" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Nova senha deve conter pelo menos uma letra minúscula, maiúscula e um número" 
    }),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Confirmação de senha não confere",
  path: ["confirm_password"],
});

// Utilities de validação
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove tags básicas
    .trim();
};

export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

// Rate limiting no frontend
export class FrontendRateLimit {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  checkLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now - record.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    record.lastAttempt = now;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const frontendRateLimit = new FrontendRateLimit();