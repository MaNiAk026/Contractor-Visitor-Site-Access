"""Database primitives for PostgreSQL-backed application services."""

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings


# PUBLIC_INTERFACE
@contextmanager
def database_connection() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    """Yield a transaction-scoped PostgreSQL connection.

    The connection string is provided by the environment, never hard-coded in
    application services. Successful blocks commit automatically; failures roll
    back so incomplete access and audit decisions cannot be persisted.
    """
    # Local Compose historically used SQLAlchemy's ``+psycopg`` dialect marker.
    # Psycopg connects directly and therefore requires the standard PostgreSQL URI.
    database_url = get_settings().database_url.replace(
        "postgresql+psycopg://",
        "postgresql://",
        1,
    )
    connection = psycopg.connect(
        database_url,
        row_factory=dict_row,
        autocommit=False,
    )
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# PUBLIC_INTERFACE
def fetch_all(query: str, parameters: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    """Execute a read query and return all rows as dictionaries."""
    with database_connection() as connection, connection.cursor() as cursor:
        cursor.execute(query, parameters)
        return list(cursor.fetchall())


# PUBLIC_INTERFACE
def fetch_one(query: str, parameters: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    """Execute a read query and return one dictionary row when present."""
    with database_connection() as connection, connection.cursor() as cursor:
        cursor.execute(query, parameters)
        return cursor.fetchone()


# PUBLIC_INTERFACE
def execute(query: str, parameters: tuple[Any, ...] = ()) -> None:
    """Execute a state-changing statement within a transaction."""
    with database_connection() as connection, connection.cursor() as cursor:
        cursor.execute(query, parameters)
