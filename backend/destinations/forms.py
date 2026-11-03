from django import forms
from .models import Destination, Place, Accommodation

class DestinationForm(forms.ModelForm):
    class Meta:
        model = Destination
        fields = ['name', 'slug', 'description', 'image_url']
