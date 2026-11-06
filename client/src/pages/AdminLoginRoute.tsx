import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminLogin from "@/pages/AdminLogin";

export default function AdminLoginRoute() {
  return <AdminAuthProvider><AdminLogin /></AdminAuthProvider>;
}
