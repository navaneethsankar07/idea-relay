import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
def test_health_check_endpoint(api_client):
    url = reverse('health-check')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'idearelay-django'
    assert data['version'] == '0.1.0'
