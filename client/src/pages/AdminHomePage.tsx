import { useEffect } from "react";
import { useLocation } from "wouter";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import AdminDashboard from "@/pages/AdminDashboard";

function ProtectedHome() {
  const { loading, session } = useAdminAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!loading && !session) navigate("/admin/login"); }, [loading, navigate, session]);
  if (loading) return <main className="admin-dashboard admin-loading-screen" dir="rtl"><span /> جارٍ التحقق من الجلسة...</main>;
  if (!session) return null;
  return <AdminDashboard initialTab="home" />;
}

export default function AdminHomePage() { return <AdminAuthProvider><ProtectedHome /></AdminAuthProvider>; }
