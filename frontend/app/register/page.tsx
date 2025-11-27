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
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .refine(
        isValidUsername,
        "Username can only contain letters, numbers, underscores and hyphens"
      ),
    displayName: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (password) => validatePassword(password).isValid,
        "Password does not meet security requirements"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
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
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl">
          <div className="card-header text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="bg-primary rounded-full p-3">
                <MessageCircle className="h-8 w-8 text-primary-foreground" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Criar uma Conta
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Participe de conversas seguras com milhares de usuários.
            </p>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Endereço de email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("email")}
                      type="email"
                      id="email"
                      placeholder="Digite seu e-mail"
                      className="input-field pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nome de usuário
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("username")}
                      type="text"
                      id="username"
                      placeholder="Escolha um nome"
                      className="input-field pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nome de exibição{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    {...register("displayName")}
                    type="text"
                    id="displayName"
                    placeholder="Seu nome de exibição"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Crie uma senha segura"
                      className="input-field pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                  {watchPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Requisitos de senha:
                      </p>
                      <div className="space-y-1 text-xs">
                        <div
                          className={`flex items-center ${
                            watchPassword.length >= 8
                              ? "text-green-600"
                              : "text-gray-500"
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
                              ? "text-green-600"
                              : "text-gray-500"
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
                              ? "text-green-600"
                              : "text-gray-500"
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
                              ? "text-green-600"
                              : "text-gray-500"
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
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                            watchPassword
                          ) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Um caractér especial
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirme sua senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Confirme sua senha"
                      className="input-field pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !passwordStrength.isValid}
                className="w-full btn-primary h-11 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Account...
                  </div>
                ) : (
                  "Criar Conta"
                )}
              </button>
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Faça login aqui
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ao criar uma conta, você concorda com nossos termos.{" "}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link
              href="/privacy"
              className="text-primary hover:text-primary/80"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
