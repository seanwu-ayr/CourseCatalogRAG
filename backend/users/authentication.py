from django.conf import settings
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from users.models import MyUser
import datetime


class CustomUserBackend(BaseBackend):
    """
    Authenticate against the settings ADMIN_LOGIN and ADMIN_PASSWORD.

    """

    def authenticate(self, request, username=None, password=None, **kwargs):
            
        UserModel = get_user_model()
        print(UserModel)
        try:
            user = UserModel.objects.get(email=username)
            print("user: \n", user)
            if user.check_password(password):
                user.last_login = datetime.datetime.now()
                user.save()
                return user
            print('user password incorrect')
            return None
        except UserModel.DoesNotExist:
            # Create a new user. There's no need to set a password
            # because only the password from settings.py is checked.
            print('user does not exist')
            return None
            

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None