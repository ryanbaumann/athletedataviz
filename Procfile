web: gunicorn app:app --timeout 30 --max-requests 1200 --preload
worker: celery worker -A app.celery --concurrency 25



