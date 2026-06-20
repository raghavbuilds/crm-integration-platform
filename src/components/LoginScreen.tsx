import React, { useState } from "react";
import { User } from "../types";
import { authService } from "../services/api";
import { Lock, UserCheck, ShieldAlert, KeyRound } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(username);
      if (res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials provided");
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (name: string) => {
    setUsername(name);
    setPassword("password");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg transform rotate-3">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          CRM Integration Platform
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter credentials or choose a quick role below to enter.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-250 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-250 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Authenticating Session..." : "Secure Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Reviewer Quick Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectUser("admin")}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold relative transition-all ${
                  username === "admin"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => selectUser("sarah_sales")}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold relative transition-all ${
                  username === "sarah_sales"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => selectUser("alex_exec")}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold relative transition-all ${
                  username === "alex_exec"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Exec
              </button>
            </div>
            <p className="mt-3.5 text-center text-[11px] text-slate-400 font-medium">
              * Password is always <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">password</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
