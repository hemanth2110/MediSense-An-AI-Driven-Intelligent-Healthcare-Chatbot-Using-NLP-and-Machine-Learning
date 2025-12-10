from django.urls import path
from . import views

urlpatterns = [
    path("chat/", views.chat),
    path("history/<str:session_id>/", views.history),
    path("sessions/", views.sessions),
    path("new_session/", views.new_session),
]
