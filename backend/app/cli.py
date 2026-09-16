"""Local backend command-line entry points for bootstrap and deterministic jobs."""

import argparse
import logging
import time
from pathlib import Path

import psycopg

from app.core.config import get_settings
from app.modules.compliance.service import run_expiry_revalidation

logger = logging.getLogger(__name__)


def _database_url() -> str:
    """Translate SQLAlchemy-style local URLs to psycopg's connection form."""
    return get_settings().database_url.replace("postgresql+psycopg://", "postgresql://", 1)


def _run_sql_files(directory: Path) -> None:
    """Apply all ordered SQL files idempotently in a single connection."""
    with psycopg.connect(_database_url(), autocommit=True) as connection:
        for path in sorted(directory.glob("*.sql")):
            print(f"BOOTSTRAP_SQL={path}", flush=True)
            with connection.cursor() as cursor:
                cursor.execute(path.read_text(encoding="utf-8"))


# PUBLIC_INTERFACE
def bootstrap() -> None:
    """Apply local migrations and deterministic seeds used by the demo API."""
    database_root = Path("/workspace/database")
    _run_sql_files(database_root / "migrations")
    _run_sql_files(database_root / "seed")


# PUBLIC_INTERFACE
def worker() -> None:
    """Run deterministic expiry scans and recover from transient local failures."""
    settings = get_settings()
    while True:
        try:
            run_expiry_revalidation()
        except Exception:
            # Notification rows are idempotent at the database boundary, so a
            # later retry cannot multiply the same revalidation notification.
            logger.exception("Expiry revalidation failed; retrying after the configured delay.")
            time.sleep(settings.worker_retry_delay_seconds)
        else:
            time.sleep(settings.expiry_revalidation_interval_seconds)


# PUBLIC_INTERFACE
def main() -> None:
    """Dispatch the supported non-interactive local backend commands."""
    parser = argparse.ArgumentParser(description="Renewi local backend commands")
    parser.add_argument("command", choices=("bootstrap", "worker"))
    args = parser.parse_args()
    if args.command == "bootstrap":
        bootstrap()
    else:
        worker()


if __name__ == "__main__":
    main()

