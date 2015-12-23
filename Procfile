web: gunicorn app:app --max-requests 1200 --preload --worker-class gevent
worker: celery worker -A app.celery