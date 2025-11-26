from rest_framework import serializers
from .models import Transaction, Category, BudgetLimit, FinancialGoal


class BudgetLimitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetLimit
        fields = "__all__"
        read_only_fields = ("user",)


class FinancialGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialGoal
        fields = "__all__"
        read_only_fields = ("user",)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        # Because we added `color` and `budget_limit` to the model,
        # they are automatically included here.
        fields = "__all__"


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ("user",)  # user is set in the view

    def create(self, validated_data):
        # user is set in viewset.perform_create
        return super().create(validated_data)
