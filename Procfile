web: gunicorn app:app --max-requests 1200 --preload --worker-class gevent
celery: celery worker -A app.celery -l info