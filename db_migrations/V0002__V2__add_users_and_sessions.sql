CREATE TABLE t_p73212382_daily_journal_app.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Пользователь',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p73212382_daily_journal_app.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p73212382_daily_journal_app.users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE t_p73212382_daily_journal_app.tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p73212382_daily_journal_app.users(id);
ALTER TABLE t_p73212382_daily_journal_app.reminders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p73212382_daily_journal_app.users(id);

CREATE INDEX idx_sessions_token ON t_p73212382_daily_journal_app.sessions(token);
CREATE INDEX idx_tasks_user_id ON t_p73212382_daily_journal_app.tasks(user_id);
CREATE INDEX idx_reminders_user_id ON t_p73212382_daily_journal_app.reminders(user_id);
