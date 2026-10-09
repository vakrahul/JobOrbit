"""
gunicorn.conf.py — High-Concurrency Production WSGI Configuration
-----------------------------------------------------------------
Optimized for 1,000,000+ requests/day (sustained 100-250 req/sec spikes).
Architecture: Multi-worker threaded (gthread) or async gevent.
"""
import multiprocessing
import os

# ── Binding & Network ──────────────────────────────────────────────────────────
port = os.environ.get("PORT", "5000")
bind = os.environ.get("GUNICORN_BIND", f"0.0.0.0:{port}")
backlog = 2048  # High TCP backlog queue for traffic spikes

# ── Worker Processes & Threads ────────────────────────────────────────────────
# Safe defaults for cloud PaaS (Koyeb 512MB limit)
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
worker_class = "gthread"
threads = int(os.environ.get("GUNICORN_THREADS", 2))
worker_connections = 500

# ── Lifecycles & Memory Management ───────────────────────────────────────────
# Automatically restart workers after serving requests to prevent memory bloat
max_requests = 2000
max_requests_jitter = 200  # Avoid all workers restarting at the same instant
timeout = 60
graceful_timeout = 30
keepalive = 5

# ── Security & Headers ────────────────────────────────────────────────────────
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
forwarded_allow_ips = "*"
secure_scheme_headers = {
    "X-FORWARDED-PROTOCOL": "ssl",
    "X-FORWARDED-PROTO": "https",
    "X-FORWARDED-SSL": "on",
}

# ── Logging ───────────────────────────────────────────────────────────────────
loglevel = os.environ.get("LOG_LEVEL", "info")
accesslog = "-"  # stdout
errorlog = "-"   # stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" (%(L)ss)'

# ── Process Naming ────────────────────────────────────────────────────────────
proc_name = "joborbit-api"
