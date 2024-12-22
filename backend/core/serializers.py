from rest_framework import serializers
from .models import AreaOfWork, PositionType, JobPosting, EmailAlertSubscription
import datetime


class AreaOfWorkSerializer(serializers.ModelSerializer):

    class Meta:
        model = AreaOfWork
        fields = '__all__'


class PositionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionType
        fields = '__all__'


class PostingSerializerView(serializers.ModelSerializer):
    position_type = serializers.SerializerMethodField(read_only=True)
    area_of_work = serializers.SerializerMethodField(read_only=True)

    def get_position_type(self, obj):
        return obj.position_type.name

    def get_area_of_work(self, obj):
        return [x.name for x in obj.area_of_work.all()]

    class Meta:
        model = JobPosting
        fields = ('id', 'title', 'position_type', 'area_of_work')


class PostingDetailSerializerView(PostingSerializerView):

    class Meta:
        model = JobPosting
        fields = '__all__'


class CreateJobPostingSerializer(serializers.ModelSerializer):
    application_start_date = serializers.DateField(required=True)
    application_end_date = serializers.DateField(required=True)

    class Meta:
        model = JobPosting
        fields = ('user', 'title', 'position_type', 'area_of_work', 'application_start_date', 'application_end_date',
                  'employer_description', 'vacancy_description', 'application_steps')


class EmailAlertSubscriptionSerializer(serializers.ModelSerializer):
    keyword = serializers.CharField(allow_blank=True, required=True)
    position_types = serializers.ListField()
    areas_of_work = serializers.ListField()

    class Meta:
        model = EmailAlertSubscription
        fields = ('email', 'keyword', 'position_types', 'areas_of_work')
