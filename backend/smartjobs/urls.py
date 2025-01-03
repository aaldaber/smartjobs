"""smartjobs URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
import user.views as user_views
import core.views as core_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', user_views.CreateUserView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/getme/', user_views.GetMeView.as_view(), name='getme'),
    path('api/areas-of-work/', core_views.AreaOfWorkList.as_view(), name='areas-of-work'),
    path('api/position-types/', core_views.PositionTypeList.as_view(), name='position-types'),
    path('api/postings/', core_views.PostingList.as_view(), name='postings'),
    path('api/postings/<int:pk>/', core_views.PostingDetail.as_view(), name='posting-detail'),
    path('api/post-a-job/', core_views.PostAJob.as_view(), name='post-a-job'),
    path('api/search/', core_views.SearchJobs.as_view(), name='search'),
    path('api/subscribe/', core_views.SearchSubscribe.as_view(), name='subscribe'),
    path('api/load-post/<str:encrypted>/', core_views.LoadPost.as_view(), name='load-post'),
    path('api/unsubscribe/<str:encrypted>/', core_views.Unsubscribe.as_view(), name='unsubscribe')

]
