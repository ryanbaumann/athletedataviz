web: gunicorn app:app --timeout 250 --max-requests 1200 --preload
worker: celery worker --app=tasks.app


