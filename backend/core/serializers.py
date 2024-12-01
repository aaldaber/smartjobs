from rest_framework import serializers
from .models import AreaOfWork, PositionType


class AreaOfWorkSerializer(serializers.ModelSerializer):

    class Meta:
        model = AreaOfWork
        fields = '__all__'


class PositionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionType
        fields = '__all__'

