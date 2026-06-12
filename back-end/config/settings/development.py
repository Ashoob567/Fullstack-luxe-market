from .base import *
import dj_database_url
import os
from dotenv import load_dotenv

load_dotenv()  # ✅ This line is critical

DEBUG = True

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=0,  # Close connections immediately after each request (prevents pool exhaustion)
        conn_health_checks=True,  # Enable connection health checks
    )
}

# Alternative: Use persistent connections with proper pooling
# For production, consider using PgBouncer or upgrading Supabase plan
# DATABASES['default']['CONN_MAX_AGE'] = 0  # Redundant with conn_max_age above
DATABASES['default']['OPTIONS'] = {
    'connect_timeout': 10,
    'options': '-c statement_timeout=30000'  # 30 second query timeout
}

# Test configuration - use in-memory SQLite for fast tests
TESTING = False

# Check if running tests - must happen before model imports
import sys
if 'test' in sys.argv or 'pytest' in sys.modules:
    TESTING = True
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
    # Use in-memory password hasher for faster tests
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]
    # Set dummy Supabase values for tests (storage won't be called)
    SUPABASE_URL = 'https://test.supabase.co'
    SUPABASE_KEY = 'test-key'
    SUPABASE_BUCKET = 'test-bucket'