web: gunicorn app:app --max-requests 1800 --preload --timeout 29 --worker-class eventlet
worker: celery worker -A app.celery --loglevel=INFO -P eventlet --concurrency=4 --autoscale=6,2