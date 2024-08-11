# users/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from .models import MyUser

class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = MyUser
        fields = ('email', 'first_name', 'last_name')

class UserChangeForm(BaseUserChangeForm):
    class Meta:
        model = MyUser
        fields = ('email', 'first_name', 'last_name')