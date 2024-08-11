from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import MyUser
from .forms import UserCreationForm, UserChangeForm

class UserAdmin(BaseUserAdmin):
    model = MyUser
    add_form = UserCreationForm
    form = UserChangeForm
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

admin.site.register(MyUser, UserAdmin)