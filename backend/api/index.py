import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p73212382_daily_journal_app"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_from_token(cur, token: str):
    cur.execute(
        f"SELECT u.id, u.name, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """API ежедневника: авторизация (/auth/*), задачи (/tasks), напоминания (/reminders)."""

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    req_headers = event.get("headers") or {}

    auth_header = req_headers.get("X-Authorization") or req_headers.get("Authorization") or ""
    token = auth_header.replace("Bearer ", "").strip() or None

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── AUTH ──
        if "/auth/register" in path:
            body = json.loads(event.get("body") or "{}")
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            name = body.get("name", "Пользователь").strip()
            if not email or not password:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "email и пароль обязательны"})}
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email=%s", (email,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": headers, "body": json.dumps({"error": "Email уже зарегистрирован"})}
            cur.execute(f"INSERT INTO {SCHEMA}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id", (email, hash_password(password), name))
            user_id = cur.fetchone()[0]
            new_token = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"token": new_token, "name": name, "email": email})}

        if "/auth/login" in path:
            body = json.loads(event.get("body") or "{}")
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users WHERE email=%s AND password_hash=%s", (email, hash_password(password)))
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}
            new_token = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user[0], new_token))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"token": new_token, "name": user[1], "email": user[2]})}

        if "/auth/me" in path:
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
            user = get_user_from_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": user[0], "name": user[1], "email": user[2]})}

        if "/auth/logout" in path:
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # ── Требуем токен для остального ──
        if not token:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}
        user_id = user[0]

        # ── TASKS ──
        if "/tasks" in path:
            if method == "GET":
                date = params.get("date", "")
                if date:
                    cur.execute(f"SELECT id, text, done, time, date, priority, category FROM {SCHEMA}.tasks WHERE user_id=%s AND date=%s ORDER BY created_at", (user_id, date))
                else:
                    cur.execute(f"SELECT id, text, done, time, date, priority, category FROM {SCHEMA}.tasks WHERE user_id=%s ORDER BY date DESC, created_at", (user_id,))
                rows = cur.fetchall()
                tasks = [{"id": r[0], "text": r[1], "done": r[2], "time": r[3] or "", "date": str(r[4]), "priority": r[5] or "medium", "category": r[6] or "personal"} for r in rows]
                return {"statusCode": 200, "headers": headers, "body": json.dumps(tasks)}

            elif method == "POST":
                body = json.loads(event.get("body") or "{}")
                text = body.get("text", "").strip()
                date = body.get("date", "")
                if not text or not date:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "text и date обязательны"})}
                cur.execute(
                    f"INSERT INTO {SCHEMA}.tasks (text, time, date, priority, category, user_id) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (text, body.get("time") or None, date, body.get("priority", "medium"), body.get("category", "personal"), user_id)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id, "text": text, "done": False, "time": body.get("time", ""), "date": date, "priority": body.get("priority", "medium"), "category": body.get("category", "personal")})}

            elif method == "PUT":
                body = json.loads(event.get("body") or "{}")
                task_id = body.get("id")
                if task_id is None:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id обязателен"})}
                fields, vals = [], []
                for f in ["text", "done", "time", "priority", "category"]:
                    if f in body:
                        fields.append(f"{f}=%s")
                        vals.append(body[f])
                if fields:
                    vals += [user_id, task_id]
                    cur.execute(f"UPDATE {SCHEMA}.tasks SET {', '.join(fields)} WHERE user_id=%s AND id=%s", vals)
                    conn.commit()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

            elif method == "DELETE":
                task_id = params.get("id")
                if not task_id:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id обязателен"})}
                cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE user_id=%s AND id=%s", (user_id, int(task_id)))
                conn.commit()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # ── REMINDERS ──
        elif "/reminders" in path:
            if method == "GET":
                cur.execute(f"SELECT id, title, time, repeat, active, emoji FROM {SCHEMA}.reminders WHERE user_id=%s ORDER BY created_at", (user_id,))
                rows = cur.fetchall()
                return {"statusCode": 200, "headers": headers, "body": json.dumps([{"id": r[0], "title": r[1], "time": r[2], "repeat": r[3], "active": r[4], "emoji": r[5] or "🔔"} for r in rows])}

            elif method == "POST":
                body = json.loads(event.get("body") or "{}")
                title = body.get("title", "").strip()
                if not title:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "title обязателен"})}
                cur.execute(
                    f"INSERT INTO {SCHEMA}.reminders (title, time, repeat, emoji, user_id) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                    (title, body.get("time", "09:00"), body.get("repeat", "Каждый день"), body.get("emoji", "🔔"), user_id)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id, "title": title, "time": body.get("time", "09:00"), "repeat": body.get("repeat", "Каждый день"), "active": True, "emoji": body.get("emoji", "🔔")})}

            elif method == "PUT":
                body = json.loads(event.get("body") or "{}")
                rem_id = body.get("id")
                if rem_id is None:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id обязателен"})}
                cur.execute(f"UPDATE {SCHEMA}.reminders SET active=%s WHERE user_id=%s AND id=%s", (body.get("active", True), user_id, rem_id))
                conn.commit()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

            elif method == "DELETE":
                rem_id = params.get("id")
                if not rem_id:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id обязателен"})}
                cur.execute(f"DELETE FROM {SCHEMA}.reminders WHERE user_id=%s AND id=%s", (user_id, int(rem_id)))
                conn.commit()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
