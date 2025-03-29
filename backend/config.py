from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Use environment variable if available, else default to local PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'POSTGRES_URI',
        'postgresql://postgres:postgres@localhost:5432/local_database'  # Default fallback
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 240,  # Recycle connections before Neon shuts down
        "pool_pre_ping": True,  # Check connection status before queries
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'your-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    REDIS_URL = os.getenv('REDIS_URL',
                          'redis://localhost:6379'
    )
