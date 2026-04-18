import { loadFromStorage, saveToStorage } from "./storage";

export type User = {
  id: string;
  name: string;
  email: string;
};

const USER_KEY = "auth_user";

export function getCurrentUser(): User | null {
  return loadFromStorage<User | null>(USER_KEY, null);
}

export function saveUser(user: User): void {
  saveToStorage(USER_KEY, user);
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
  // Clear user-specific tasks key when logging out so next user starts fresh
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((k) => {
    if (k.startsWith("all_tasks_v2") || k.startsWith("reminders_data") || k.startsWith("tasks_")) {
      localStorage.removeItem(k);
    }
  });
}

export function getUserTaskKey(userId: string): string {
  return `all_tasks_v2_${userId}`;
}

export function getUserReminderKey(userId: string): string {
  return `reminders_data_${userId}`;
}
