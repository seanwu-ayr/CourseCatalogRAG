from django.urls import path    
from .views import RegisterView, LoginView, ConversationView
  
  
urlpatterns = [  
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'), 
    path('conversations/', ConversationView.as_view(), name='login'), 
]