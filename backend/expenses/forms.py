from django import forms
from .models import Expense

class ExpenseForm(forms.ModelForm):
    class Meta:
        model = Expense
        fields = ['trip', 'name', 'category', 'amount', 'description']

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount < 0:
            raise forms.ValidationError("Expense amount cannot be negative.")
        return amount
