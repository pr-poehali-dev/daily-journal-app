import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { saveToStorage } from "@/lib/storage";

interface Props {
  onLogout: () => void;
  onExport: () => void;
  userName: string;
}

export default function Settings({ onLogout, onExport, userName }: Props) {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [notifSound, setNotifSound] = useState(true);
  const [notifVibro, setNotifVibro] = useState(false);
  const [startDay, setStartDay] = useState("Понедельник");
  const [name, setName] = useState(userName);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-foreground" : "bg-muted"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-background rounded-full transition-all ${value ? "left-6" : "left-1"}`} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );

  const Row = ({ icon, label, children, onClick }: { icon: string; label: string; children: React.ReactNode; onClick?: () => void }) => (
    <div className="flex items-center gap-4 px-4 py-3.5 cursor-default" onClick={onClick}>
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon name={icon as never} size={15} className="text-foreground" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="px-6 py-8 max-w-lg mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-foreground">Настройки</h1>
      </div>

      {/* Profile */}
      <Section title="Профиль">
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center text-lg font-semibold flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); saveToStorage("user_name", e.target.value); }}
              className="text-sm font-semibold text-foreground bg-transparent outline-none w-full border-b border-transparent focus:border-border transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-0.5">Нажми, чтобы изменить имя</p>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Внешний вид">
        <Row icon={isDark ? "Sun" : "Moon"} label="Тёмная тема">
          <Toggle value={isDark} onChange={toggleTheme} />
        </Row>
        <Row icon="Calendar" label="Первый день недели">
          <select
            value={startDay}
            onChange={(e) => setStartDay(e.target.value)}
            className="text-sm text-muted-foreground bg-transparent outline-none"
          >
            <option>Понедельник</option>
            <option>Воскресенье</option>
          </select>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Уведомления">
        <Row icon="Bell" label="Звук">
          <Toggle value={notifSound} onChange={setNotifSound} />
        </Row>
        <Row icon="Smartphone" label="Вибрация">
          <Toggle value={notifVibro} onChange={setNotifVibro} />
        </Row>
      </Section>

      {/* Data */}
      <Section title="Данные">
        <Row icon="Download" label="Скачать задачи (JSON)" onClick={onExport}>
          <Icon name="ChevronRight" size={15} className="text-muted-foreground" />
        </Row>
      </Section>

      {/* Account */}
      <Section title="Аккаунт">
        <Row icon="LogOut" label="Выйти из аккаунта" onClick={() => setShowLogoutConfirm(true)}>
          <Icon name="ChevronRight" size={15} className="text-muted-foreground" />
        </Row>
      </Section>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-end justify-center z-50 pb-8 px-6 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 animate-slide-up">
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground mb-1">Выйти из аккаунта?</p>
              <p className="text-xs text-muted-foreground">Задачи останутся на устройстве</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-2.5 bg-destructive text-white rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4">Версия 1.0.0 · день</p>
    </div>
  );
}
