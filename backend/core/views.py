from .models import AreaOfWork, PositionType, JobPosting
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework import permissions
from .serializers import AreaOfWorkSerializer, PositionTypeSerializer, PostingSerializerView, PostingDetailSerializerView
from rest_framework.pagination import PageNumberPagination


class CustomNumberPagination(PageNumberPagination):
    page_size = 10


class AreaOfWorkList(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = AreaOfWork.objects.all()
    serializer_class = AreaOfWorkSerializer


class PositionTypeList(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = PositionType.objects.all()
    serializer_class = PositionTypeSerializer


class PostingList(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = JobPosting.objects.filter(is_active=True).order_by('-date_posted')
    serializer_class = PostingSerializerView
    pagination_class = CustomNumberPagination


class PostingDetail(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = JobPosting.objects.filter(is_active=True)
    serializer_class = PostingDetailSerializerView

