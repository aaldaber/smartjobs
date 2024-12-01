from django.db import models
from user.models import User


class PositionType(models.Model):
    name = models.CharField(max_length=255)


class AreaOfWork(models.Model):
    name = models.CharField(max_length=255)


class JobPosting(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=255)
    position_type = models.ForeignKey(PositionType, on_delete=models.CASCADE, related_name='job_postings')
    area_of_work = models.ManyToManyField(AreaOfWork, related_name='job_postings')
    application_start_date = models.DateTimeField()
    application_end_date = models.DateTimeField()
    employer_description = models.TextField()
    vacancy_description = models.TextField()
    application_steps = models.TextField()
    custom_fields = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField()
    date_posted = models.DateTimeField()
    date_last_modified = models.DateTimeField()


class EmailAlertSubscription(models.Model):
    email = models.EmailField()
    keyword = models.CharField(max_length=50)
    position_type = models.ManyToManyField(PositionType, related_name='subscriptions')
    area_of_work = models.ManyToManyField(AreaOfWork, related_name='subscriptions')
    last_alert_sent = models.DateTimeField()
    last_post_sent = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)


class JobView(models.Model):
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    alert_subscription = models.ForeignKey(EmailAlertSubscription, on_delete=models.CASCADE)
    date_viewed = models.DateTimeField()
