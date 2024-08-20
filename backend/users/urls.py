from django.urls import path    
from .views import RegisterView, LoginView, ConversationView, MessageView
  
  
urlpatterns = [  
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'), 
    path('conversations/', ConversationView.as_view(), name='conversations'),
    path('messages/', MessageView.as_view(), name='messages'),  
]