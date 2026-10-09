"""
app.py — JobOrbit Application Factory
--------------------------------------
Clean factory pattern:
- All config from core.config.settings (pydantic, no hardcodes)
- All extensions from core.extensions (single source of truth)
- Flask-Migrate for versioned DB migrations
- Flask-Caching for response caching
- Flask-Limiter for rate limiting
- Global error handlers for all AppError subclasses
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from core.config import settings
from core.extensions import db, migrate, cache, limiter
from core.exceptions import AppError


def create_app(test_config=None):
    app = Flask(__name__)

    # ── Configuration ────────────────────────────────────────────────────────
    base_dir = os.path.abspath(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)

    # Resolve relative SQLite path to absolute
    db_url = settings.DATABASE_URL
    if db_url.startswith('sqlite:///') and not os.path.isabs(db_url[10:]):
        abs_path = os.path.join(base_dir, db_url[10:])
        db_url = f'sqlite:///{abs_path}'

    engine_options = {
        'pool_recycle': settings.SQLALCHEMY_POOL_RECYCLE,
        'pool_timeout': settings.SQLALCHEMY_POOL_TIMEOUT,
        'pool_pre_ping': True,
    }
    if not db_url.startswith('sqlite'):
        engine_options.update({
            'pool_size': settings.SQLALCHEMY_POOL_SIZE,
            'max_overflow': settings.SQLALCHEMY_MAX_OVERFLOW,
        })

    app.config.update({
        'SECRET_KEY': settings.SECRET_KEY,
        'SQLALCHEMY_DATABASE_URI': db_url,
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SQLALCHEMY_ENGINE_OPTIONS': engine_options,
        # Cache
        **settings.cache_config,
        # Rate limiter storage
        'RATELIMIT_STORAGE_URL': settings.RATELIMIT_STORAGE_URL,
        'RATELIMIT_DEFAULT': settings.RATE_LIMIT_DEFAULT,
        'RATELIMIT_HEADERS_ENABLED': True,
    })

    if test_config:
        app.config.update(test_config)

    # ── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)   # enables: flask db init / migrate / upgrade
    cache.init_app(app)
    limiter.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": settings.cors_origins_list}},
        supports_credentials=True,
    )

    # ── Security & Anti-Scraping Protection ──────────────────────────────────
    from core.anti_scraper import anti_scraper_shield, honeypot_trap
    app.before_request(anti_scraper_shield)

    # Honeypot trap endpoints (crawlers following hidden links get auto-banned)
    app.add_url_rule('/api/v1/internal/dump', view_func=honeypot_trap, methods=['GET'])
    app.add_url_rule('/api/jobs/export-all', view_func=honeypot_trap, methods=['GET'])
    app.add_url_rule('/api/scrape-feed', view_func=honeypot_trap, methods=['GET'])

    # ── Import all models (Flask-Migrate needs to discover them) ─────────────
    with app.app_context():
        from models.job import Job
        from models.user import User, SavedJob
        from models.hr import HRContact
        from models.research import ProfessorContact
        from models.prep import PrepQuestion
        from models.audit import ScrapeLog
        db.create_all()

    # ── Register Blueprints ───────────────────────────────────────────────────
    from routes.admin import admin_bp
    from routes.jobs import jobs_bp
    from routes.hr import hr_bp
    from routes.auth import auth_bp
    from routes.premium import premium_bp
    from routes.research import research_bp
    from routes.prep import prep_bp
    from routes.ai import ai_bp
    from routes.tracker import tracker_bp
    from routes.resume import resume_bp

    app.register_blueprint(admin_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(premium_bp)
    app.register_blueprint(research_bp)
    app.register_blueprint(prep_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(tracker_bp)
    app.register_blueprint(resume_bp)

    # ── Global Error Handlers ────────────────────────────────────────────────
    @app.errorhandler(AppError)
    def handle_app_error(e: AppError):
        return jsonify(e.to_dict()), e.status_code

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'status': 'error', 'error_code': 'NOT_FOUND', 'message': 'Endpoint not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'status': 'error', 'error_code': 'METHOD_NOT_ALLOWED', 'message': str(e)}), 405

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({
            'status': 'error',
            'error_code': 'RATE_LIMITED',
            'message': 'Too many requests. Please slow down and try again shortly.',
        }), 429

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'status': 'error', 'error_code': 'INTERNAL_ERROR', 'message': 'An unexpected error occurred'}), 500

    # ── Health Endpoint ───────────────────────────────────────────────────────
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'JobOrbit Aggregator & Admin API',
            'version': '3.0.0',
            'env': settings.FLASK_ENV,
        })

    # ── Background Scheduler ─────────────────────────────────────────────────
    if not app.config.get('TESTING', False):
        try:
            from scheduler import init_scheduler
            init_scheduler(app)
        except Exception as e:
            app.logger.warning(f"Scheduler skipped: {e}")

    return app


# WSGI entrypoint for Gunicorn / Koyeb / Docker
app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=(settings.FLASK_ENV == 'development'),
    )
