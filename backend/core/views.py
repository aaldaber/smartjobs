from .models import AreaOfWork, PositionType
from rest_framework.generics import ListAPIView
from rest_framework import permissions
from .serializers import AreaOfWorkSerializer, PositionTypeSerializer


class AreaOfWorkList(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = AreaOfWork.objects.all()
    serializer_class = AreaOfWorkSerializer


class PositionTypeList(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = PositionType.objects.all()
    serializer_class = PositionTypeSerializer
