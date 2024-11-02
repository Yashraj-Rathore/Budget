from rest_framework import serializers
from .models import Transaction, Category
from django.contrib.auth.models import User  # Import the User model

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')  # Add field for category name for easy frontend consumption

    class Meta:
        model = Transaction
        fields = '__all__'

    # Override the create method to set the user automatically or make it optional
    def create(self, validated_data):
        # If user is not provided, you can set a default one here (for example, the first user)
        if 'user' not in validated_data:
            # Assuming you have at least one user in the DB. Replace this line accordingly.
            validated_data['user'] = User.objects.first()
        return super().create(validated_data)
