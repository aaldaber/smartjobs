from django.contrib import admin
from .models import PositionType, AreaOfWork, JobPosting

admin.site.register(PositionType)
admin.site.register(AreaOfWork)
admin.site.register(JobPosting)

