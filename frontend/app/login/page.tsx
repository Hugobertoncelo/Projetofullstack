"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../src/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import LoadingSpinner from "../../src/components/LoadingSpinner";
import { motion } from "framer-motion";
import FormInput from "../../src/components/FormInput";
import { loginSchema, type LoginFormData } from "@/schemas/loginSchema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (requiresTwoFactor) {
      setFocus("twoFactorCode");
    }
  }, [requiresTwoFactor, setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await login(data.email, data.password, data.twoFactorCode);

      if (result.success) {
        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true);
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "Falha ao fazer login");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#161033] via-[#1f1149] to-[#0d0b22] animate-gradient-xy"></div>

      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-600 opacity-30 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500 opacity-30 blur-[120px] animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-20"
      >
        <div className="card bg-white/10 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(120,40,255,0.4)] backdrop-blur-xl p-8">
          <motion.div
            initial={{ scale: 0.6, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-4 rounded-full shadow-xl shadow-purple-500/40">
              <MessageCircle className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-extrabold text-white text-center tracking-wide">
            Bem-vindo ao Chat
          </h1>
          <p className="text-gray-300 text-center mt-2 text-sm">
            Faça login para continuar a conversa.
          </p>

          <div className="mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 text-red-300 border border-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <FormInput
                label="Email"
                id="email"
                type="email"
                placeholder="Digite seu email"
                disabled={isLoading}
                error={errors.email}
                {...register("email")}
              />

              <FormInput
                label="Senha"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                disabled={isLoading}
                error={errors.password}
                {...register("password")}
                inputClassName="pr-10"
                children={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              {requiresTwoFactor && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <FormInput
                    label="Código de verificação"
                    id="twoFactorCode"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    disabled={isLoading}
                    error={errors.twoFactorCode}
                    {...register("twoFactorCode")}
                    inputClassName="text-center tracking-widest"
                  />
                </motion.div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl font-semibold text-white bg-gradient-to-r
                  from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/70
                  transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Entrando...
                  </div>
                ) : requiresTwoFactor ? (
                  "Verificar código"
                ) : (
                  "Entrar no Chat"
                )}
              </motion.button>

              <p className="text-center text-gray-300 mt-4 text-sm">
                Não tem conta?{" "}
                <Link
                  href="/register"
                  className="text-purple-300 hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
