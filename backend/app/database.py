import os

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOCAL_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'lexaai.db')}"


def build_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

    connect_args = {"sslmode": "require"} if url.startswith("postgresql") else {}
    return create_engine(url, pool_pre_ping=True, connect_args=connect_args)


def resolve_database_url() -> str:
    candidate = DATABASE_URL or LOCAL_DATABASE_URL

    try:
        engine = build_engine(candidate)
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        return candidate
    except SQLAlchemyError:
        return LOCAL_DATABASE_URL


RESOLVED_DATABASE_URL = resolve_database_url()
engine = build_engine(RESOLVED_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
