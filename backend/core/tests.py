from django.test import TestCase
from django.urls import reverse

class CoreViewTests(TestCase):
    def test_home_view_status_code(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Welcome to TripWise Backend')

    def test_about_view_status_code(self):
        response = self.client.get(reverse('about'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'About TripWise')

    def test_api_health_view(self):
        response = self.client.get(reverse('api_health'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('service', data)
        self.assertIn('phase', data)
        self.assertEqual(data['status'], 'ok')
