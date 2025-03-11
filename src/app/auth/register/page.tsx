"use client";

import { Input } from "@/components/ui/input";
import { AuthButton } from "@/features/auth/components/auth-button";
import { useAuth } from "@/hooks/use-auth";
import { RegisterFormValues, registerSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const { register: registerUser, isRegistering, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerUser(data);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2 font-poppins">
          Create an account
        </h1>
        <p className="text-secondary-600 text-sm font-poppins font-light">
          Join TaskMaster to manage your tasks efficiently
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-6 sm:p-8">
          {registerError && (
            <div className="mb-6 rounded-lg bg-danger-50 p-4 text-sm text-danger-700 border-l-4 border-danger-500 animate-fade-in">
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>
                <span className="font-poppins">
                  {registerError instanceof Error
                    ? registerError.message
                    : "Registration failed. Please try again."}
                </span>
              </div>
            </div>
          )}

          <form
            className="space-y-6 font-poppins"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-secondary-700 mb-1"
                >
                  Full name
                </label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  {...register("name")}
                  aria-invalid={errors.name ? "true" : "false"}
                  className={`w-full transition-all duration-200 ${
                    errors.name ? "border-danger-500 focus:ring-danger-500" : ""
                  }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-danger-600 flex items-center space-x-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      />
                      <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                      />
                    </svg>
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-secondary-700 mb-1"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  className={`w-full transition-all duration-200 ${
                    errors.email ? "border-danger-500 focus:ring-danger-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-danger-600 flex items-center space-x-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      />
                      <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                      />
                    </svg>
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-secondary-700 mb-1"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  className={`w-full transition-all duration-200 ${
                    errors.password ? "border-danger-500 focus:ring-danger-500" : ""
                  }`}
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-danger-600 flex items-center space-x-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      />
                      <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                      />
                    </svg>
                    <span>{errors.password.message}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-secondary-500">Must be at least 6 characters</p>
              </div>
            </div>

            <div className="pt-2">
              <AuthButton isLoading={isRegistering}>Create account</AuthButton>
            </div>
          </form>
        </div>

        <div className="px-6 sm:px-8 py-4 bg-secondary-50 border-t border-secondary-100 text-center">
          <p className="text-sm text-secondary-600 font-poppins">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
