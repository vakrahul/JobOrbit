"""
core/extensions.py
------------------
All Flask extension instances live here.
Import from this module everywhere — never re-instantiate.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# ── Database ORM ──────────────────────────────────────────────────────────────
db = SQLAlchemy()

# ── Migrations (Alembic wrapper) ──────────────────────────────────────────────
migrate = Migrate()

# ── Response + Query Cache ────────────────────────────────────────────────────
cache = Cache()

# ── Rate Limiter (per remote IP by default) ───────────────────────────────────
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per hour", "60 per minute"],
    storage_uri="memory://",        # overridden by app config at init time
)
