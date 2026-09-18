import { useState } from "react";
import { type NavFn } from "../types";
import { Button, Input, Alert, BlogForgeLogo } from "../components/ui";
import { api, type AuthResponse } from "../services/api";

const TechVisual = () => (
  <div className="absolute inset-0 bg-[#0B1020] overflow-hidden">
    <svg
      className="absolute inset-0 w-full h-full scale-110 translate-y-8"
      viewBox="0 0 480 640"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id="auth-dots"
          x="0"
          y="0"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.9" fill="#4F46E5" opacity="0.18" />
        </pattern>

        <filter id="auth-glow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />

          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="480" height="640" fill="#0B1020" />

      <rect width="480" height="640" fill="url(#auth-dots)" />

      <ellipse
        cx="120"
        cy="200"
        rx="100"
        ry="80"
        fill="#4F46E5"
        opacity="0.05"
      />

      <ellipse
        cx="380"
        cy="420"
        rx="120"
        ry="90"
        fill="#06B6D4"
        opacity="0.06"
      />

      <circle
        cx="240"
        cy="260"
        r="48"
        fill="#111827"
        stroke="#4F46E5"
        strokeWidth="1.5"
        filter="url(#auth-glow)"
      />

      <text
        x="240"
        y="255"
        textAnchor="middle"
        fill="#A5B4FC"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
      >
        ● AI
      </text>

      <text
        x="240"
        y="270"
        textAnchor="middle"
        fill="#C7D2FE"
        fontSize="9"
        fontFamily="Inter, sans-serif"
      >
        Agent Ready
      </text>

      <circle
        cx="130"
        cy="160"
        r="30"
        fill="#111827"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="130"
        y="157"
        textAnchor="middle"
        fill="#64748B"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        PLAN
      </text>

      <text
        x="130"
        y="169"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Outline
      </text>

      <circle
        cx="355"
        cy="160"
        r="30"
        fill="#111827"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="355"
        y="157"
        textAnchor="middle"
        fill="#64748B"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        SRC
      </text>

      <text
        x="355"
        y="169"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Research
      </text>

      <circle
        cx="130"
        cy="360"
        r="30"
        fill="#111827"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="130"
        y="357"
        textAnchor="middle"
        fill="#64748B"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        WRITE
      </text>

      <text
        x="130"
        y="369"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Draft
      </text>

      <circle
        cx="355"
        cy="360"
        r="30"
        fill="#111827"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="355"
        y="357"
        textAnchor="middle"
        fill="#64748B"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        ✓ REV
      </text>

      <text
        x="355"
        y="369"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Review
      </text>

      <line
        x1="158"
        y1="175"
        x2="196"
        y2="215"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      <line
        x1="326"
        y1="175"
        x2="285"
        y2="215"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      <line
        x1="158"
        y1="345"
        x2="196"
        y2="305"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      <line
        x1="326"
        y1="345"
        x2="285"
        y2="305"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      <rect
        x="50"
        y="480"
        width="200"
        height="70"
        rx="8"
        fill="#0F172A"
        stroke="#1E293B"
        strokeWidth="1"
      />

      <text
        x="62"
        y="500"
        fill="#818CF8"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        class BlogAgent:
      </text>

      <text
        x="72"
        y="513"
        fill="#10B981"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        {" "}
        def research(self):
      </text>

      <text
        x="82"
        y="526"
        fill="#94A3B8"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        {" "}
        return sources
      </text>

      <text
        x="62"
        y="542"
        fill="#64748B"
        fontSize="7"
        fontFamily="JetBrains Mono, monospace"
      >
        &#x2F;&#x2F; 24 sources collected
      </text>

      <rect
        x="250"
        y="460"
        width="185"
        height="52"
        rx="8"
        fill="#0F172A"
        stroke="#1E293B"
        strokeWidth="1"
      />

      <text
        x="262"
        y="480"
        fill="#94A3B8"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Latest blog generated
      </text>

      <text
        x="262"
        y="496"
        fill="#E2E8F0"
        fontSize="10"
        fontWeight="bold"
        fontFamily="Inter, sans-serif"
      >
        RAG in Production
      </text>

      <text
        x="262"
        y="507"
        fill="#4ADE80"
        fontSize="7"
        fontFamily="JetBrains Mono, monospace"
      >
        ● Completed · 4,200 words
      </text>
    </svg>

    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B1020] to-transparent h-32" />
  </div>
);

// ─── Login ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  navigate: NavFn;
  onLogin: (auth: AuthResponse) => Promise<void>;
  initialEmail?: string;
  registrationSuccess?: boolean;
}

export function LoginPage({
  navigate,
  onLogin,
  initialEmail = "",
  registrationSuccess = false,
}: LoginPageProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    api
      .login(email, password)
      .then(onLogin)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden bg-slate-50">
      {/* 50% VISUAL SIDE */}
      <div className="hidden lg:block relative w-[50%] h-screen overflow-hidden">
        <TechVisual />

        <div className="absolute top-8 left-8 z-10">
          <BlogForgeLogo dark />
        </div>
      </div>

      {/* 50% AUTH SIDE */}
      <div className="w-full lg:w-[50%] min-h-screen lg:h-screen flex items-center justify-center overflow-y-auto p-6 sm:p-10 lg:items-start lg:pt-8 lg:pb-8">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-7 sm:p-9">
          <div className="lg:hidden mb-8">
            <BlogForgeLogo />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>

          <p className="text-slate-500 text-sm mt-1 mb-7">
            Sign in to your BlogForge workspace.
          </p>

          {registrationSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              Account created successfully. Please log in with your email and
              password.
            </div>
          )}

          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input
              label="Email"
              placeholder="e.g. jahanzeb@gmail.com"
              value={email}
              onChange={setEmail}
              autoFocus
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={setPassword}
              type="password"
            />

            <div className="mt-1">
              <Button fullWidth loading={loading} onClick={handleLogin}>
                Login
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              {"Don't have an account?"}

              <button
                onClick={() =>
                  navigate({
                    section: "public",
                    page: "register",
                  })
                }
                className="ml-1.5 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

interface RegisterPageProps {
  navigate: NavFn;
  onLogin: (auth: AuthResponse) => Promise<void>;
}

export function RegisterPage({ navigate }: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordReqs = [
    {
      label: "At least 8 characters",
      ok: password.length >= 8,
    },
    {
      label: "Contains a number",
      ok: /\d/.test(password),
    },
    {
      label: "Contains a letter",
      ok: /[a-zA-Z]/.test(password),
    },
  ];

  const handleRegister = () => {
    if (!username || !email || !password || !confirm) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);

    api
      .register(username, email, password)
      .then(() => {
        setLoading(false);

        navigate({
          section: "public",
          page: "login",
          loginEmail: email,
          registrationSuccess: true,
        });
      })
      .catch((e) => {
        setError(e.message || "Unable to create your account.");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden bg-slate-50">
      {/* 50% VISUAL SIDE */}
      <div className="hidden lg:block relative w-[50%] h-screen overflow-hidden">
        <TechVisual />

        <div className="absolute top-8 left-8 z-10">
          <BlogForgeLogo dark />
        </div>
      </div>

      {/* 50% AUTH SIDE */}
      <div className="w-full lg:w-[50%] min-h-screen lg:h-screen flex items-center justify-center overflow-y-auto p-6 sm:p-10 lg:items-start lg:pt-8 lg:pb-8">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-7 sm:p-9">
          <div className="lg:hidden mb-8">
            <BlogForgeLogo />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Create your BlogForge account
          </h1>

          <p className="text-slate-500 text-sm mt-1 mb-7">
            Start creating research-backed technical blogs.
          </p>

          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="e.g. Jahanzeb17"
              value={username}
              onChange={setUsername}
              autoFocus
            />

            <Input
              label="Email"
              placeholder="e.g. jahanzeb@gmail.com"
              value={email}
              onChange={setEmail}
              type="email"
            />

            <div>
              <Input
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChange={setPassword}
                type="password"
              />

              {password.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {passwordReqs.map((r) => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      <svg
                        className={`w-3 h-3 ${
                          r.ok ? "text-green-500" : "text-slate-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <span
                        className={`text-xs ${
                          r.ok ? "text-green-600" : "text-slate-400"
                        }`}
                      >
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={setConfirm}
              type="password"
              error={
                confirm.length > 0 && confirm !== password
                  ? "Passwords do not match"
                  : undefined
              }
            />

            <div className="mt-1">
              <Button fullWidth loading={loading} onClick={handleRegister}>
                Create Account
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?
              <button
                onClick={() =>
                  navigate({
                    section: "public",
                    page: "login",
                  })
                }
                className="ml-1.5 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
