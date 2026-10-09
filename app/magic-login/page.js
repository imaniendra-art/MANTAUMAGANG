"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Token tidak ditemukan di URL. Pastikan Anda menyalin seluruh link yang diberikan.");
      return;
    }

    const performLogin = async () => {
      try {
        const res = await signIn("credentials", {
          magicToken: token,
          redirect: false,
        });

        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/mentor");
        }
      } catch (err) {
        setError("Terjadi kesalahan pada server saat mencoba login.");
      }
    };

    performLogin();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 text-center">
        {error ? (
          <div>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Login Gagal</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Kembali ke Login Manual
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Memverifikasi Akses...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mohon tunggu sebentar, Anda sedang diarahkan ke Dashboard Mentor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <MagicLoginContent />
    </Suspense>
  );
}
