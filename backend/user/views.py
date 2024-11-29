from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from .serializers import UserSerializer


class CreateUserView(CreateAPIView):
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = UserSerializer
