from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import MyUser, Conversation, Message
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.http import JsonResponse
from users.serializer import ConversationSerializer, MessageSerializer

def save_chat_history(conversation_id:str, responses:list[Message], user_id=None):
    # Get or create the chat session
    chat_session, created = Conversation.objects.get_or_create(conversation_id=conversation_id, defaults={'user_id': user_id})

    # Save user message
    for response in responses:
        msg, created = Message.objects.get_or_create(conversation=conversation_id, sender=response.sender, content=response.content, timestamp=response.timestamp )


    return chat_session

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        print("credentials")
        print(username, password, email)

        if not password or not email:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        if MyUser.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        user = MyUser.objects.create_user(email=email, password=password)
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    #permission_classes = [AllowAny]

    def post(self, request):
        print(request.data)
        username = request.data.get('username')
        password = request.data.get('password')
        #print(username, password)
        user = authenticate(request=request, username=username, password=password)
        print(user)
        if user is None : 
            print("401 error")
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_json = {"id":user.pk, "name": user.get_full_name(), "email":str(user), "password":user.password}
        print("user found ...")
        return JsonResponse(user_json)

class ConversationView(APIView):
    def get(self, request):
        print(request.query_params)
        user_id = request.query_params.get('user')
     
        if user_id:
            convos = Conversation.objects.filter(user_id=user_id)

        if convos:
            serializer = ConversationSerializer(convos, many=True)
            print(serializer.data)
            print("user has conversations ...")
            payload = {"data" : serializer.data}
            return JsonResponse(payload)
        
        return JsonResponse({})
    
class MessageView(APIView):
        
    def get(self, request):
    
        conversation_id = request.query_params.get('conversation')
        if conversation_id:
            conversation =  Message.objects.filter(conversation_id=conversation_id)
        
        if conversation:
            serializer = MessageSerializer(conversation, many=True)
            print(serializer.data)
            print("user has conversations ...")
            payload = {"data" : serializer.data}
            return JsonResponse(payload)
        
        return JsonResponse({})

    
           