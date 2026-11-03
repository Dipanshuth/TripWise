from django import forms
from .models import Trip

class TripForm(forms.ModelForm):
    class Meta:
        model = Trip
        fields = [
            'source', 'destination', 'days', 'travellers', 'travel_style',
            'selected_transport', 'selected_accommodation', 'discount', 'status'
        ]

    def clean(self):
        cleaned_data = super().clean()
        days = cleaned_data.get('days')
        travellers = cleaned_data.get('travellers')
        
        if days is not None and days < 1:
            self.add_error('days', "A trip must be at least 1 day.")
            
        if travellers is not None and travellers < 1:
            self.add_error('travellers', "A trip must have at least 1 traveller.")
            
        return cleaned_data
