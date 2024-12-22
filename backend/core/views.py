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


class SearchJobs(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = JobPosting.objects.filter(is_active=True).order_by('-date_posted')
    serializer_class = PostingSerializerView

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        keyword = self.request.GET.get('keyword')
        areas_of_work = self.request.GET.getlist('areas_of_work')
        position_types = [int(x) for x in self.request.GET.getlist('position_types')]
        areas_of_work = [int(x) for x in areas_of_work]

        if position_types and areas_of_work and keyword:
            queryset = queryset.filter(title__icontains=keyword,
                                       area_of_work__pk__in=areas_of_work,
                                       position_type__pk__in=position_types)
        elif keyword and (position_types and not areas_of_work):
            queryset = queryset.filter(title__icontains=keyword,
                                       position_type__pk__in=position_types)
        elif keyword and (areas_of_work and not position_types):
            queryset = queryset.filter(title__icontains=keyword,
                                       area_of_work__pk__in=areas_of_work)
        elif keyword and (not areas_of_work and not position_types):
            queryset = queryset.filter(title__icontains=keyword)
        elif not keyword and (areas_of_work and position_types):
            queryset = queryset.filter(area_of_work__pk__in=areas_of_work,
                                       position_type__pk__in=position_types)
        elif not keyword and (areas_of_work and not position_types):
            queryset = queryset.filter(area_of_work__pk__in=areas_of_work)
        elif not keyword and (position_types and not areas_of_work):
            queryset = queryset.filter(position_type__pk__in=position_types)
        else:
            queryset = JobPosting.objects.none()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
