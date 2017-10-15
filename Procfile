web: gunicorn app:app --max-requests 1800 --preload --timeout 29 
worker: celery worker -A app.celery --loglevel=INFO