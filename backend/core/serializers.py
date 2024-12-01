from rest_framework import serializers
from .models import AreaOfWork, PositionType, JobPosting


class AreaOfWorkSerializer(serializers.ModelSerializer):

    class Meta:
        model = AreaOfWork
        fields = '__all__'


class PositionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionType
        fields = '__all__'


class PostingSerializerView(serializers.ModelSerializer):

    class Meta:
        model = JobPosting
        fields = '__all__'
