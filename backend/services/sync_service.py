"""
services/sync_service.py
------------------------
OOP Sync & Ingestion Service.
Coordinates background scraping, cache eviction upon sync completion,
and status monitoring for the Admin dashboard.
"""
from typing import Optional, Dict, Any, Tuple
from core.extensions import cache
from core.exceptions import SyncAlreadyRunningError
from scraper.sync import sync_manager, start_background_sync


class SyncService:
    def get_status(self) -> Dict[str, Any]:
        """Returns the current real-time sync progress state."""
        return sync_manager.get_state()

    def is_active(self) -> bool:
        """Checks if a sync job is currently in progress."""
        return sync_manager.is_running

    def trigger_sync(
        self,
        app,
        target: str = 'all',
        mode: str = 'incremental',
        max_pages: Optional[int] = None
    ) -> Tuple[bool, str]:
        """
        Triggers a sync run. Invalidates caches and launches background thread.
        """
        if sync_manager.is_running:
            raise SyncAlreadyRunningError("A synchronization job is already running.")

        success, message = start_background_sync(
            app,
            target=target,
            mode=mode,
            max_pages=max_pages
        )

        if success:
            # Clear relevant caches so new data is immediately visible
            self.invalidate_all_caches()

        return success, message

    def invalidate_all_caches(self):
        """Clears static cached views after new data is ingested."""
        try:
            cache.delete('admin_stats')
            cache.delete('job_filters')
        except Exception:
            pass


sync_service = SyncService()
