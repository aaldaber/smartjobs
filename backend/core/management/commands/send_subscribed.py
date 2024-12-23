import requests
from django.utils import timezone
from django.core.management.base import BaseCommand, CommandError
from core.models import EmailAlertSubscription, JobPosting
from django.conf import settings
from cryptography.fernet import Fernet


class Command(BaseCommand):

    def send_simple_message(self, to, subject, message):
        try:
            req = requests.post(
                settings.MAILGUN_URL,
                auth=("api", settings.MAILGUN_API_KEY),
                data={"from": settings.MAILGUN_SENDER,
                      "to": [to],
                      "subject": subject,
                      "html": message},
                headers={"accept": "application/json"})
            if req.status_code != 200:
                print(req.status_code)
                print(req.content)
                return False
            return True
        except Exception as e:
            print(str(e))
            return False

    def generate_list_for_sending(self, queryset, sub):
        fernet = Fernet(settings.ENCRYPT_KEY)
        message = ('Dear Subscriber,<br>'
                   'Below are newly posted vacancies:<br><br>')
        for each in queryset:
            enc_string = "{}-{}".format(each.id, sub.id)
            enc_string = fernet.encrypt(enc_string.encode()).decode()
            message += '<a href="{}/{}">{}</a><br>'.format(settings.SITE_URL, enc_string, each.title)
        message += '<br>'
        message += 'If you wish to unsubscribe from this email, you can click <a href="{}/unsubscribe-{}">this</a> link.'.format(settings.SITE_URL, fernet.encrypt(str(sub.id).encode()).decode())
        return message


    def handle(self, *args, **options):
        for sub in EmailAlertSubscription.objects.filter(active=True):
            keyword = sub.keyword
            position_types = [x.id for x in sub.position_type.all()]
            areas_of_work = [x.id for x in sub.area_of_work.all()]
            if not sub.last_post_sent:
                queryset = JobPosting.objects.filter(is_active=True, date_posted__gt=sub.creation_date)
            else:
                queryset = JobPosting.objects.filter(is_active=True, id__gt=sub.last_post_sent.id)

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

            if queryset:
                message = self.generate_list_for_sending(queryset, sub)
                email = self.send_simple_message(sub.email, "Your weekly vacancies", message)
                if email:
                    sub.last_post_sent = JobPosting.objects.latest('id')
                    sub.last_alert_sent = timezone.now()
                    sub.save()
