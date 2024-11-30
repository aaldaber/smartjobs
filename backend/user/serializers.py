from rest_framework import serializers
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class RegisterUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    def create(self, validated_data):

        user = UserModel.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )

        return user

    class Meta:
        model = UserModel
        fields = ("id", "email", "password", )


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserModel
        fields = ("email",)
