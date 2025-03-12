import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TM</span>
          </div>
          <span className="font-semibold text-secondary-900 text-lg">TaskMaster</span>
        </div>

        <div className="flex items-center">
          <div className="mr-4 text-sm text-secondary-600">
            Welcome,{" "}
            <span className="font-medium text-secondary-900">{user?.name || "User"}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="font-poppins"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
} 