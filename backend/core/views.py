import os.path

from .models import AreaOfWork, PositionType, JobPosting
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView
from rest_framework.views import APIView
from rest_framework import permissions, status
from .serializers import (AreaOfWorkSerializer, PositionTypeSerializer, PostingSerializerView,
                          PostingDetailSerializerView, CreateJobPostingSerializer)
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.storage import FileSystemStorage
from django.conf import settings


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


class PostAJob(CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = JobPosting.objects.all()
    serializer_class = CreateJobPostingSerializer

    def post(self, request, *args, **kwargs):
        data = request.data.dict()
        data["user"] = request.user.id
        data['area_of_work'] = data['area_of_work'].split(',')
        serializer = CreateJobPostingSerializer(data=data)
        custom_fields = []
        if serializer.is_valid():
            instance = serializer.save()
            for eachk, eachv in data.items():
                if eachk.startswith('custom_fields') and 'content' in eachk:
                    if type(eachv) is InMemoryUploadedFile:
                        path = os.path.join(settings.MEDIA_ROOT, str(instance.id))
                        FileSystemStorage(location=path).save(eachv.name, eachv)
                        custom_fields.append({"field_name": "File",
                                              "field_content": "{}{}/{}".format(settings.MEDIA_URL, instance.id, eachv.name)})
                    if type(eachv) is str:
                        custom_fields.append({"field_name": "Text",
                                              "field_content": eachv})
            instance.custom_fields = custom_fields
            instance.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(data={"message": "Job posted!"}, status=HTTP_200_OK)
