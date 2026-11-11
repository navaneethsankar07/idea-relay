from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Health check endpoint to verify service availability.
    Does not require authentication.
    """
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response(
            {
                "status": "healthy",
                "service": "idearelay-django",
                "version": "0.1.0",
            },
            status=status.HTTP_200_OK,
        )
