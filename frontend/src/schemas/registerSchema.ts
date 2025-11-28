import * as z from "zod";
import { validatePassword, isValidUsername } from "../../src/lib/utils";

export const registerSchema = z
  .object({
    email: z.string().email("Endereço de e-mail inválido"),
    username: z
      .string()
      .min(3, "O nome de usuário deve ter pelo menos 3 caracteres.")
      .max(20, "O nome de usuário deve ter menos de 20 caracteres.")
      .refine(
        isValidUsername,
        "O nome de usuário só pode conter letras, números, sublinhados e hífenes."
      ),
    displayName: z.string().optional(),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .refine(
        (password) => validatePassword(password).isValid,
        "A senha não atende aos requisitos de segurança."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
