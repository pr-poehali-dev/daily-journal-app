import { useState } from "react";
import Icon from "@/components/ui/icon";
import { saveUser, type User } from "@/lib/auth";

interface Props {
  onAuth: (user: User) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const USERS_KEY = "app_users_db";

  type StoredUser = { id: string; name: string; email: string; passwordHash: string };

  const hashPass = (p: string) =>
    p.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(36);

  const getUsers = (): StoredUser[] => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
  };
  const saveUsers = (users: StoredUser[]) =>
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const submit = () => {
    setError("");
    if (!form.email.trim() || !form.password) { setError("Заполни все поля"); return; }
    if (mode === "register" && !form.name.trim()) { setError("Введи имя"); return; }
    if (form.password.length < 4) { setError("Пароль минимум 4 символа"); return; }

    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const hash = hashPass(form.password);

      if (mode === "register") {
        if (users.find((u) => u.email === form.email.toLowerCase())) {
          setError("Email уже зарегистрирован"); setLoading(false); return;
        }
        const newUser: StoredUser = {
          id: Date.now().toString(),
          name: form.name.trim(),
          email: form.email.toLowerCase(),
          passwordHash: hash,
        };
        saveUsers([...users, newUser]);
        const authUser = { id: newUser.id, name: newUser.name, email: newUser.email };
        saveUser(authUser);
        onAuth(authUser);
      } else {
        const found = users.find((u) => u.email === form.email.toLowerCase() && u.passwordHash === hash);
        if (!found) { setError("Неверный email или пароль"); setLoading(false); return; }
        const authUser = { id: found.id, name: found.name, email: found.email };
        saveUser(authUser);
        onAuth(authUser);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-foreground mb-2">День</h1>
          <p className="text-muted-foreground text-sm">Личный ежедневник</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Имя</label>
              <input
                autoFocus
                type="text"
                placeholder="Как тебя зовут?"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in">
              <Icon name="AlertCircle" size={14} className="text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Данные хранятся только на устройстве
        </p>
      </div>
    </div>
  );
}
