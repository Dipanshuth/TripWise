from django.urls import path
from . import views

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='csrf'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.current_user_view, name='me'),
    path('profile/', views.profile_view, name='profile'),
]
