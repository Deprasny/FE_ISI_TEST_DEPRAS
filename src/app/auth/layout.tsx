"use client";

import { useAuthStore } from "@/store/auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { ReactNode } from "react";

// Create a client
const queryClient = new QueryClient();

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-white via-secondary-50 to-primary-50 flex flex-col items-center justify-center font-poppins">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px] opacity-50"></div>

        {/* Branding */}
        <div className="fixed top-8 left-8 z-10">
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <span className="text-white font-bold text-lg font-poppins">TM</span>
            </div>
            <span className="font-semibold text-secondary-900 text-xl group-hover:text-primary-600 transition-colors duration-300 font-poppins tracking-tight">
              TaskMaster
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-md z-10">{children}</div>

        {/* Footer */}
        <div className="fixed bottom-4 text-center text-secondary-500 text-sm z-10 font-poppins font-light">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </div>
      </div>
    </QueryClientProvider>
  );
}
