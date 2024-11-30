from rest_framework import permissions
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.response import Response
from .serializers import RegisterUserSerializer, UserSerializer


class CreateUserView(CreateAPIView):
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = RegisterUserSerializer


class GetMeView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
