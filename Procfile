web: gunicorn app:app --timeout 250 --max-requests 1200 --preload
worker: celery worker -A app.celery --concurrency=5 -l info -Ofair -Q feeds,default -n one
worker: celery worker -A app.celery --concurrency=5 -l info -Ofair -Q feeds,default -n two
worker: celery worker -A app.celery --concurrency=5 -l info -Ofair -Q feeds,default -n three


