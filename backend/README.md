# TripWise Backend

This is the Django backend for the TripWise application.

## Python Version
This project requires Python 3.10+ (tested with Python 3.14).

## Setup Instructions

### Backend
1. **Create the virtual environment:**
   From the project root, navigate to the backend directory and create a virtual environment:
   ```cmd
   cd backend
   py -m venv venv
   ```

2. **Activate the virtual environment (Windows):**
   ```cmd
   venv\Scripts\activate
   ```

3. **Install requirements:**
   ```cmd
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```cmd
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Seed Database:**
   ```cmd
   python manage.py seed_tripwise
   ```

6. **Start the development server:**
   ```cmd
   python manage.py runserver
   ```

### Frontend
1. **Install dependencies:**
   From the project root:
   ```cmd
   npm install
   ```

2. **Start the development server:**
   ```cmd
   npm run dev
   ```
*(Both frontend and backend servers need to run simultaneously during development)*

## Accessing the Application
- React Frontend: [http://localhost:5173/](http://localhost:5173/)
- Django Core Home: [http://127.0.0.1:8000/core/](http://127.0.0.1:8000/core/)
- Django Health API: [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)
- Django Admin: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

## Project Structure
- `config/`: The main Django project configuration package (settings, URLs).
- `core/`: The foundational Django app demonstrating the MVT architecture.
- `destinations/`: App for destinations, places, accommodations, and transport.
- `trips/`: App for trips, itinerary, and cost calculations.
- `expenses/`: App for discounts and custom expenses.
- `venv/`: Local Python virtual environment (ignored by Git).
- `requirements.txt`: Python package dependencies.
- `.env.example`: Example environment variables template.

## Phase 3
Phase 3 implementation includes:
- **Models & Relationships**:
  - `Destination` (One-to-One with `DestinationPricing`)
  - `Destination` -> `Place`, `Accommodation`, `Activity`, `TransportOption`
  - `Trip` -> `Destination`, `TransportOption`, `Accommodation`, `Discount`
  - `Trip` -> `TripPlace` (Many-to-Many through model)
  - `Trip` -> `ItineraryDay` -> `ItineraryItem`
  - `Trip` -> `Expense`
- **Database Seeding**: Management command `seed_tripwise` seeds initial mock data.
- **ORM & CRUD**: Endpoints for Destinations, Trips, and Expenses with proper querysets and filtering.
- **Forms**: ModelForms for Destinations, Trips, and Expenses (can be used in views/admin).
- **Cost Engine**: A dedicated service (`CostCalculator`) deterministically calculates accommodation, transport, food, activities, local travel, discounts, and total trip budget.
- **Testing**: `python manage.py test` verifies models, constraints, api endpoints, and calculation logic.

## Phase 4
Phase 4 implementation includes:
- **Authentication**: Custom User models (optional) or Django standard User, with endpoints for Registration, Login, Logout, and Profile viewing/updating.
- **Session Authentication**: Secure session-based authentication between React and Django, handling CSRF tokens dynamically in `apiService.ts`.
- **Trip Ownership**: Trips are now tied to `user`. Endpoints verify ownership (`user=request.user`) ensuring users can only see, modify, and delete their own trips.
- **Django Admin**: Advanced admin registration for managing Users, Trips, Destinations, and other models.

## Phase 5
Phase 5 implementation includes:
- **AJAX Search Endpoints**: Real-time asynchronous endpoints in `search_views.py` using Django QuerySets for:
  - Destination search (`/api/search/destinations/?q=...`)
  - Place search and filtering (`/api/search/places/?q=...&destination=...`)
  - Accommodation filtering (`/api/search/accommodations/...`)
  - Transport filtering (`/api/search/transport/...`)
- **Debounced React Integration**: Frontend UI (`SearchModal.tsx` and `Plan.tsx`) updated to fetch from Django asynchronously with a `useDebounce` hook, preventing unnecessary API requests while maintaining core functionality.
- **Dynamic Cost Updates**: The frontend requests dynamic trip cost calculation via AJAX (`POST /api/trips/<id>/calculate/`) dynamically updating the UI without reloading the page.
- **Reports Generation**: Dedicated service structure (`reports/services/csv_reports.py` and `pdf_reports.py`) generating CSV and PDF reports.
  - CSV exports of Trip summaries and Expenses (`/api/reports/trips/<id>/csv/` and `/expenses/csv/`).
  - PDF generation of Trip summaries and Expenses using `reportlab`.
- **Report Security**: All report endpoints verify authentication and enforce Trip ownership.
- **Testing**: Added testing coverage for all search query permutations, report generation endpoints, content type validation, and security access controls.

## Future Phases
The following will be implemented in later phases:
- Gemini API integration for AI assistant
- Production deployment and configuration
