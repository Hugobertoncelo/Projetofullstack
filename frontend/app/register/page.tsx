"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../src/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  Mail,
  User,
  Check,
  X,
} from "lucide-react";
import LoadingSpinner from "../../src/components/LoadingSpinner";
import { motion } from "framer-motion";
import { validatePassword, isValidUsername } from "../../src/lib/utils";
const registerSchema = z
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
type RegisterFormData = z.infer<typeof registerSchema>;
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    errors: [] as string[],
  });
  const { register: registerUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const watchPassword = watch("password", "");
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);
  useEffect(() => {
    if (watchPassword) {
      setPasswordStrength(validatePassword(watchPassword));
    }
  }, [watchPassword]);
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await registerUser(
        data.email,
        data.username,
        data.password,
        data.displayName
      );
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Falha no registro");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 px-4 py-12 relative overflow-hidden">
      {/* Efeitos de luz de fundo */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500 opacity-30 blur-[120px] animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500 opacity-30 blur-[120px] animate-pulse-slow z-0"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card bg-white/10 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(120,40,255,0.4)] backdrop-blur-xl p-8">
          <div className="card-header text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-4 rounded-full shadow-xl shadow-purple-500/40">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white text-center tracking-wide">
              Crie sua Conta
            </h1>
            <p className="text-gray-200 text-center mt-2 text-sm">
              Participe de conversas seguras com milhares de usuários.
            </p>
          </div>
          <div className="card-content mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/20 text-red-300 border border-red-700 px-4 py-3 rounded-lg text-sm mb-2"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Endereço de email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    id="email"
                    placeholder="Digite seu e-mail"
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Nome de usuário
                  </label>
                  <input
                    {...register("username")}
                    type="text"
                    id="username"
                    placeholder="Escolha um nome"
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20"
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.username.message}
                    </p>
                  )}
                </div>
                {/* Display Name */}
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Nome de exibição{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    {...register("displayName")}
                    type="text"
                    id="displayName"
                    placeholder="Seu nome de exibição"
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20"
                    disabled={isLoading}
                  />
                </div>
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Crie uma senha segura"
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                  {watchPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 p-3 bg-white/10 rounded-lg"
                    >
                      <p className="text-xs font-medium text-gray-200 mb-2">
                        Requisitos de senha:
                      </p>
                      <div className="space-y-1 text-xs">
                        <div
                          className={`flex items-center ${
                            watchPassword.length >= 8
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {watchPassword.length >= 8 ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Pelo menos 8 caracteres
                        </div>
                        <div
                          className={`flex items-center ${
                            /[A-Z]/.test(watchPassword)
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {/[A-Z]/.test(watchPassword) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Uma letra maiúscula
                        </div>
                        <div
                          className={`flex items-center ${
                            /[a-z]/.test(watchPassword)
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {/[a-z]/.test(watchPassword) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Uma letra minúscula
                        </div>
                        <div
                          className={`flex items-center ${
                            /[0-9]/.test(watchPassword)
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {/[0-9]/.test(watchPassword) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Um número
                        </div>
                        <div
                          className={`flex items-center ${
                            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                              watchPassword
                            )
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                            watchPassword
                          ) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Um caractere especial
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Confirme sua senha
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Confirme sua senha"
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !passwordStrength.isValid}
                className="w-full py-3 mt-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/70 transition-all text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Criando Conta...
                  </div>
                ) : (
                  "Criar Conta"
                )}
              </button>
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-gray-200">
                  Já tem uma conta?{" "}
                  <Link
                    href="/login"
                    className="text-purple-300 hover:underline font-medium transition-colors"
                  >
                    Faça login aqui
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-300">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/terms" className="text-purple-300 hover:underline">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-purple-300 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
