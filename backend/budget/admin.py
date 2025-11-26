
# Register your models here.

from django.contrib import admin
from .models import Category, Transaction, BudgetLimit, FinancialGoal

admin.site.register(Category)
admin.site.register(Transaction)
admin.site.register(BudgetLimit)
admin.site.register(FinancialGoal)
