import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.conf import settings
settings.ALLOWED_HOSTS = ['*']
from django.test import Client

client = Client(SERVER_NAME='localhost')
res = client.get('/api/transport/?origin=Delhi&destination=1')
print("Status Code:", res.status_code)
print("Data:", res.json())
