from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import MyUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.http import JsonResponse
import json

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
    permission_classes = [AllowAny]

    def post(self, request):
        print(request.data)
        username = request.data.get('username')
        password = request.data.get('password')
        #print(username, password)
        user = authenticate(username=username, password=password)
        print(user)
        print(user.password)
        user_json = {"email":str(user), "password":user.password}
        if user:
            print("user found ...")
            return JsonResponse(user_json)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

