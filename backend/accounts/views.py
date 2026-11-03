import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .forms import UserRegistrationForm, ProfileForm

def serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'profile': {
            'display_name': user.profile.display_name,
            'bio': user.profile.bio,
            'budget_style': user.profile.budget_style,
            'preferred_trip_length': user.profile.preferred_trip_length,
            'favourite_destination': user.profile.favourite_destination,
            'profile_image_url': user.profile.profile_image_url,
        } if hasattr(user, 'profile') else {}
    }

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'message': 'CSRF cookie set'})

@require_http_methods(["POST"])
def register_view(request):
    try:
        data = json.loads(request.body)
        form = UserRegistrationForm(data)
        if form.is_valid():
            user = form.save()
            # Log the user in automatically after registration
            login(request, user)
            return JsonResponse({'success': True, 'message': 'Registration successful', 'user': serialize_user(user)}, status=201)
        else:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'errors': {'non_field_errors': [str(e)]}}, status=400)

@require_http_methods(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True, 'message': 'Login successful', 'user': serialize_user(user)})
        else:
            return JsonResponse({'success': False, 'errors': {'non_field_errors': ['Invalid credentials.']}}, status=401)
    except Exception as e:
        return JsonResponse({'success': False, 'errors': {'non_field_errors': [str(e)]}}, status=400)

@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out'})

@require_http_methods(["GET"])
def current_user_view(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True, 'user': serialize_user(request.user)})
    return JsonResponse({'authenticated': False}, status=401)

@login_required
@require_http_methods(["GET", "PUT", "PATCH"])
def profile_view(request):
    if request.method == 'GET':
        return JsonResponse({'profile': serialize_user(request.user)['profile']})

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)

            # Since it's a PATCH, we should only update provided fields
            # Django forms require all fields unless we're clever or we just manually update
            # or pass the current instance data combined with new data
            profile = request.user.profile
            for field, value in data.items():
                if hasattr(profile, field):
                    setattr(profile, field, value)
            profile.save()
            return JsonResponse({'success': True, 'profile': serialize_user(request.user)['profile']})
        except Exception as e:
            return JsonResponse({'success': False, 'errors': {'non_field_errors': [str(e)]}}, status=400)
