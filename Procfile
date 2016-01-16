web: gunicorn app:app --max-requests 800 --preload --timeout 29 --worker-class eventlet
worker: celery worker -A app.celery -C