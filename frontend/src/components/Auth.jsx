import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await axios.post("/api/auth/register", form);
        setMode("login");
        setError("");
        return;
      }
      const params = new URLSearchParams();
      params.append("username", form.email);
      params.append("password", form.password);
      const { data } = await axios.post("/api/auth/login", params);
      localStorage.setItem("token", data.access_token);
      nav("/dashboard");
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 pl-10 " +
    "text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800 " +
    "outline-none text-sm transition-all";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
            <Shield size={36} className="text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white">PhishGuard AI</h1>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered email threat detection
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {/* Tab toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 text-sm py-2 rounded-lg capitalize transition-all duration-150
                  ${mode === m
                    ? "bg-gray-700 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-300"
                  }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "register" && (
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-gray-500" />
              <input
                placeholder="Full name"
                value={form.full_name}
                className={inp}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={15} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              className={inp}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              className={inp}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
                       py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Please wait...
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Protected by AI-powered threat detection
        </p>
      </div>
    </div>
  );
}
