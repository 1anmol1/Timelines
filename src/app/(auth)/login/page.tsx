"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[var(--bg-charcoal)]">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-[var(--accent-cyan)]/8 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-[var(--accent-electric)]/8 blur-[100px]" />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-electric)] bg-clip-text text-transparent">
              TIMELINES
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            Turn content into a journey. Create interactive stories with locked chapters,
            progressive unlocking, and shareable experiences.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" /> Create</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-electric)]" /> Connect</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" /> Control</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-electric)] bg-clip-text text-transparent">
                TIMELINES
              </span>
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Create. Connect. Control.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1.5">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="input-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--accent-cyan)] hover:underline font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
