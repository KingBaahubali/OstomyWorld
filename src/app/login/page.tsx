"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Where to go after login — default to account page
  const redirectTo = searchParams.get("redirect") || "/account";

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSuccess = () => {
    router.replace(redirectTo);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      handleSuccess();
    } catch (err: any) {
      const msg = err.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : err.code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : err.code === "auth/weak-password"
        ? "Password must be at least 6 characters."
        : err.message || "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      handleSuccess();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "An error occurred during Google sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-public text-text-muted">Loading...</div>;
  }

  // Already logged in — waiting for redirect
  if (user) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-public text-text-muted">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-24 px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card w-full p-8 sm:p-10 rounded-2xl border border-text-muted/10 shadow-xl"
        style={{ maxWidth: "448px" }}
      >
        <div className="text-center mb-8">
          <h1 className="font-outfit text-3xl font-bold text-text-main mb-2">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="font-public text-text-muted">
            {isLogin
              ? "Sign in to continue."
              : "Create an account to complete your order."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-sm font-public text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-public font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors mb-6 shadow-sm disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-text-muted/20"></div>
          <span className="font-public text-sm text-text-muted">OR</span>
          <div className="flex-1 h-px bg-text-muted/20"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <div>
            <label className="block font-outfit font-bold text-text-main mb-2 text-sm">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block font-outfit font-bold text-text-main mb-2 text-sm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-primary text-background font-outfit font-bold text-lg py-4 rounded-xl hover:opacity-95 transition-all shadow-md shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="font-public text-text-muted text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="font-outfit font-bold text-primary hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center font-public text-text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
