import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/AuthPage";
import { ThemeProvider } from "@/lib/theme";
import { getCurrentUser, logout, type User } from "@/lib/auth";
import { getAllTasks } from "@/lib/tasks";

type Tab = "home" | "calendar" | "reminders" | "settings";

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "House", label: "Главная" },
  { id: "calendar", icon: "CalendarDays", label: "Календарь" },
  { id: "reminders", icon: "Bell", label: "Напоминания" },
  { id: "settings", icon: "Settings2", label: "Настройки" },
];

const App = () => {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [tab, setTab] = useState<Tab>("home");

  const handleAuth = (u: User) => { setUser(u); setTab("home"); };

  const handleLogout = () => { logout(); setUser(null); };

  const handleExport = () => {
    const tasks = getAllTasks();
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), user: user?.name, tasks }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `den-tasks-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <ThemeProvider>
        <AuthPage onAuth={handleAuth} />
      </ThemeProvider>
    );
  }

  const pages: Record<Tab, React.ReactNode> = {
    home: <Home />,
    calendar: <CalendarPage />,
    reminders: <Reminders />,
    settings: <Settings onLogout={handleLogout} onExport={handleExport} userName={user.name} />,
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
          <main className="flex-1 overflow-y-auto pb-28">
            {pages[tab]}
          </main>
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-background/90 backdrop-blur-xl border-t border-border px-2 pb-2">
            <div className="flex items-center justify-around py-2">
              {NAV.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? "bg-foreground" : ""}`}>
                      <Icon name={item.icon as never} size={17} className={active ? "text-background" : ""} />
                    </div>
                    <span className={`text-[10px] font-medium tracking-wide transition-all ${active ? "text-foreground" : ""}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
