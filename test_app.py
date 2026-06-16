import unittest
from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        self.ctx = app.app_context()
        self.ctx.push()
        self.client = app.test_client()

    def tearDown(self):
        self.ctx.pop()

    def test_index(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_api_release_notes(self):
        response = self.client.get('/api/release-notes')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        if len(data) > 0:
            first = data[0]
            self.assertIn('title', first)
            self.assertIn('content', first)
            self.assertIn('link', first)
            self.assertIn('id', first)
            self.assertIn('updated', first)

if __name__ == '__main__':
    unittest.main()
