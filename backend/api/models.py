from django.db import models

class Conversation(models.Model):
    session_id = models.CharField(max_length=200)
    role = models.CharField(max_length=20)  # "user" or "assistant"
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Session(models.Model):
    session_id = models.CharField(max_length=200, unique=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
