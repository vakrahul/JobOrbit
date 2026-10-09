import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)

def scheduled_sync_job(app):
    """
    Automatic periodic job execution function.
    Runs every 3 hours to capture ONLY NEW incoming jobs using incremental delta sync.
    Stops automatically when it encounters previously ingested jobs.
    """
    logger.info("[Scheduler] Triggering scheduled incremental job sync (new jobs only)...")
    try:
        from scraper.sync import ScraperPipeline
        with app.app_context():
            pipeline = ScraperPipeline()
            # Incremental sync: crawls page 1 onwards, stops early when hitting existing jobs
            res = pipeline.run_full(target='all', mode='incremental')
            logger.info(f"[Scheduler] Completed incremental sync: {res}")
    except Exception as e:
        logger.error(f"[Scheduler] Error running scheduled sync: {e}")

def init_scheduler(app):
    """
    Starts APScheduler within the Flask application lifecycle.
    """
    interval_hours = int(os.getenv('SYNC_INTERVAL_HOURS', '3'))
    
    if not scheduler.running:
        scheduler.add_job(
            func=lambda: scheduled_sync_job(app),
            trigger=IntervalTrigger(hours=interval_hours),
            id='joborbit_auto_sync',
            name='Auto Incremental Job Sync (Every 3 Hours)',
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"[Scheduler] Background scheduler initialized (Interval: every {interval_hours} hours, Mode: Incremental).")

def get_scheduler_status():
    """
    Returns live scheduler state for the Admin Dashboard.
    """
    interval_hours = int(os.getenv('SYNC_INTERVAL_HOURS', '3'))
    is_running = scheduler.running
    next_run = None

    if is_running:
        job = scheduler.get_job('joborbit_auto_sync')
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

    return {
        'is_active': is_running,
        'interval_hours': interval_hours,
        'mode': 'Incremental (New Only)',
        'next_run_time': next_run,
        'job_name': 'Automated Feed Ingestion'
    }
