import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const { configured, loading, session, signIn } = useAdminAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (!loading && session) navigate("/admin");
  }, [loading, navigate, session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
    else navigate("/admin");
  };

  const resetPassword = async () => {
    setError("");
    setResetMessage("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) { setError("أدخل البريد الإلكتروني أولاً لإرسال رابط الاستعادة."); return; }
    setResetBusy(true);
    const result = await supabase?.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/admin/login` });
    setResetBusy(false);
    if (result?.error) setError(result.error.message);
    else setResetMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
  };

  return <main className="admin-login-page" dir="rtl"><div className="admin-login-orb admin-login-orb--one" /><div className="admin-login-orb admin-login-orb--two" /><section className="admin-login-card"><div className="admin-login-brand"><span>HPC</span><p>إدارة مؤتمر التخصصات الصحية</p></div><div className="admin-login-title"><small><ShieldCheck size={14} /> مساحة آمنة</small><h1>تسجيل الدخول<br /><b>للوحة التحكم</b></h1><p>أدخل بيانات حساب الإدارة للوصول إلى محتوى الموقع.</p></div>{!configured && <div className="admin-message admin-message--error">أضف VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY لإتاحة الدخول.</div>}{error && <div className="admin-message admin-message--error">{error}</div>}{resetMessage && <div className="admin-message admin-message--success">{resetMessage}</div>}<form className="admin-login-form" onSubmit={submit}><label><span>البريد الإلكتروني</span><div><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div></label><label><span>كلمة المرور</span><div><LockKeyhole size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label><button disabled={busy || !configured} type="submit">{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}<ArrowLeft size={16} /></button><button className="admin-reset-button" disabled={resetBusy || !configured} type="button" onClick={resetPassword}>{resetBusy ? "جارٍ الإرسال..." : "نسيت كلمة المرور؟ إرسال رابط استعادة"}</button></form><Link className="admin-back-link" href="/">العودة إلى الموقع</Link></section></main>;
}
