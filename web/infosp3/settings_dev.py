from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

ALLOWED_HOSTS = ['*']

CONSTANCE_CONFIG = {
    "SERVIDOR_NODEAPI": ("http://10.51.12.64:3001", "http://10.51.12.64:3001")
}