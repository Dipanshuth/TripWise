from django.test import TestCase, Client
from django.contrib.auth.models import User
import json

class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', email='test@test.com', password='password123')

    def test_registration(self):
        response = self.client.post('/api/auth/register/', json.dumps({
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'password123'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 2)

    def test_duplicate_username(self):
        response = self.client.post('/api/auth/register/', json.dumps({
            'username': 'testuser',
            'email': 'new@test.com',
            'password': 'password123'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', json.dumps({
            'username': 'testuser',
            'password': 'password123'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

    def test_login_failure(self):
        response = self.client.post('/api/auth/login/', json.dumps({
            'username': 'testuser',
            'password': 'wrongpassword'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_me_authenticated(self):
        self.client.login(username='testuser', password='password123')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['authenticated'])

    def test_me_unauthenticated(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 401)

    def test_profile_update(self):
        self.client.login(username='testuser', password='password123')
        response = self.client.patch('/api/auth/profile/', json.dumps({
            'display_name': 'Test Display Name',
            'budget_style': 'premium'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.display_name, 'Test Display Name')
        self.assertEqual(self.user.profile.budget_style, 'premium')
