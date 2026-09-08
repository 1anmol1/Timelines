"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
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
        <div className="absolute top-1/3 right-1/3 w-[280px] h-[280px] rounded-full bg-[var(--accent-electric)]/8 blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[220px] h-[220px] rounded-full bg-[var(--accent-cyan)]/8 blur-[100px]" />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-electric)] bg-clip-text text-transparent">
              TIMELINES
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            Build interactive stories with chapters that unlock progressively.
            Share your journey with the world.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-electric)] bg-clip-text text-transparent">
                TIMELINES
              </span>
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Create. Connect. Control.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1.5">Start building interactive journeys</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="input-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
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
              <label className="input-label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className={`flex items-center gap-2 text-xs ${check.pass ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}`}>
                      <CheckCircle2 size={12} /> {check.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading || password.length < 6}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-cyan)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
