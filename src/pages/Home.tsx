import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  getAllTasks, saveTasks,
  CATEGORIES, PRIORITIES,
  type Task, type TaskPriority, type TaskCategory,
} from "@/lib/tasks";
import DatePicker from "@/components/DatePicker";
import TaskList from "@/components/TaskList";

const DAYS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const todayDate = new Date();
const todayKey = todayDate.toISOString().split("T")[0];

type AddForm = {
  text: string;
  time: string;
  date: string;
  priority: TaskPriority;
  category: TaskCategory;
};

const EMPTY_FORM: AddForm = {
  text: "",
  time: "",
  date: todayKey,
  priority: "medium",
  category: "personal",
};

export default function Home() {
  const [allTasks, setAllTasks] = useState<Task[]>(() => getAllTasks());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [filterCat, setFilterCat] = useState<TaskCategory | "all">("all");

  const syncedTasks = allTasks.filter((t) => t.date === todayKey);

  useEffect(() => {
    saveTasks(allTasks);
  }, [allTasks]);

  const dayName = DAYS_RU[todayDate.getDay()];
  const dateStr = `${todayDate.getDate()} ${MONTHS_RU[todayDate.getMonth()]} ${todayDate.getFullYear()}`;

  const toggle = (id: number) =>
    setAllTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask = (id: number) =>
    setAllTasks((prev) => prev.filter((t) => t.id !== id));

  const editTask = (id: number, fields: Partial<Task>) =>
    setAllTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));

  const reorderTasks = (reordered: Task[]) =>
    setAllTasks(reordered);

  const addTask = () => {
    if (!form.text.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: form.text.trim(),
      done: false,
      time: form.time,
      date: form.date,
      priority: form.priority,
      category: form.category,
    };
    setAllTasks((prev) => [...prev, newTask]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const displayTasks = syncedTasks.filter(
    (t) => filterCat === "all" || t.category === filterCat
  );

  const done = syncedTasks.filter((t) => t.done).length;
  const progress = syncedTasks.length ? Math.round((done / syncedTasks.length) * 100) : 0;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase mb-1">
          {dayName}
        </p>
        <h1 className="font-display text-4xl text-foreground leading-tight">
          {dateStr}
        </h1>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Выполнено</span>
          <span className="text-sm font-semibold text-foreground">{done}/{syncedTasks.length}</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterCat("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            filterCat === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border text-muted-foreground hover:border-foreground/30"
          }`}
        >
          Все
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCat(cat.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filterCat === cat.value
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border text-muted-foreground hover:border-foreground/30"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="mb-6">
        <TaskList
          tasks={displayTasks}
          todayKey={todayKey}
          onToggle={toggle}
          onRemove={removeTask}
          onEdit={editTask}
          onReorder={reorderTasks}
          previewCount={1}
        />
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-3 p-4 bg-card border border-dashed border-border rounded-xl text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all"
        >
          <Icon name="Plus" size={16} />
          <span className="text-sm">Добавить задачу</span>
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-scale-in">
          <input
            autoFocus
            type="text"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Название задачи..."
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
          />

          {/* Date & time row */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block mb-1">Дата</label>
              <DatePicker value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block mb-1">Время</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block mb-2">Тип</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    form.category === cat.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span className={form.category === cat.value ? "text-background" : ""}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block mb-2">Приоритет</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                    form.priority === p.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${form.priority === p.value ? "bg-background" : p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTask}
              className="flex-1 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Добавить
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Quote */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="font-display text-lg italic text-muted-foreground leading-relaxed">
          «Лучший способ предсказать будущее — создать его»
        </p>
      </div>
    </div>
  );
}