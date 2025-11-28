import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(1, "A senha é obrigatória"),
  twoFactorCode: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
