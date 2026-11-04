# TripWise

TripWise is a full-stack travel planning application that helps travellers discover destinations, build itineraries, compare transport and accommodation options, estimate trip costs, manage expenses, and export trip reports.

The project has two cooperating applications:

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Backend:** Django 6.1 with a JSON API, Django session authentication, cost-calculation services, search endpoints, and CSV/PDF report generation.

## What TripWise does

### Explore and discover

- Browse destinations with descriptions, images, recommended duration, best season, and travel categories.
- Open destination details and inspect places, activities, accommodations, and transport options.
- Search destinations, places, accommodations, and transport asynchronously.
- Use debounced search in the planning experience to avoid sending a request for every keystroke.
- Save places for later in the browser.

### Plan a trip

- Select an origin, destination, number of days, travellers, travel style, transport, accommodation, and places to visit.
- Add and remove places from a trip.
- Generate or regenerate a day-by-day itinerary from selected places.
- Duplicate, edit, save, and delete trips.
- Apply percentage or fixed-value discounts.
- Add custom expenses to a trip.

### Estimate costs

The backend cost engine calculates minimum, typical, and maximum estimates for:

- Inter-city transportation.
- Accommodation.
- Food.
- Activities and place entry fees.
- Local travel.
- Custom expenses.
- Discounts.
- Subtotal, total, cost per traveller, and cost per day.

Pricing can be per person, per vehicle, fixed, or per trip where the data model supports it. Trip validation prevents invalid combinations, such as selecting accommodation from another destination or transport that does not match the selected origin and destination.

### Accounts and trip ownership

- Register, log in, log out, and inspect the current account.
- Update profile preferences such as display name, bio, budget style, preferred trip length, and favourite destination.
- Use Django session authentication with CSRF protection.
- Authenticated API operations enforce ownership so a user cannot access or export another user's trips.

### Reports

Authenticated users can download:

- Trip summary CSV.
- Expense CSV.
- Trip summary PDF.
- Expense PDF.

Reports include the trip configuration, cost breakdown, selected places, and expense details as appropriate.

## Application architecture

```text
Browser
  |
  | React SPA (Vite)
  | React Router, contexts, localStorage, fetch
  |
  +--> /api/*  --> Django API
                       |
                       +--> Accounts and session authentication
                       +--> Destinations, places, activities, stays, transport
                       +--> Trips, itinerary, expenses, discounts
                       +--> CostCalculator service
                       +--> CSV/PDF report services
                       +--> SQLite (default) or PostgreSQL
```

### Frontend

The frontend entry point is [`src/main.tsx`](./src/main.tsx). [`src/App.tsx`](./src/App.tsx) defines the application providers and routes:

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/explore` | Destination discovery |
| `/plan` | Trip planning workflow |
| `/trip/:id` | Trip result and cost view |
| `/destinations/:slug` | Destination details |
| `/my-trips` | Saved and created trips |
| `/saved` | Saved places |
| `/profile` | User profile |
| `/accommodation` | Accommodation browsing |
| `/transport` | Transport browsing |
| `/login` | Login |
| `/register` | Registration |

Important frontend modules:

- [`src/context/AuthContext.tsx`](./src/context/AuthContext.tsx): loads and exposes the authenticated user.
- [`src/context/TripContext.tsx`](./src/context/TripContext.tsx): manages the current client-side trip workspace, saved places, discounts, expenses, and itinerary regeneration.
- [`src/services/apiService.ts`](./src/services/apiService.ts): central API client, credentials handling, CSRF token handling, health checks, search, trip operations, and report downloads.
- [`src/services/storageService.ts`](./src/services/storageService.ts): browser `localStorage` persistence for trips, saved places, and profile-related client data.
- [`src/utils/itineraryHelper.ts`](./src/utils/itineraryHelper.ts): itinerary generation and regeneration helpers.
- [`src/types/index.ts`](./src/types/index.ts): shared frontend domain types.

The frontend uses `localStorage` for the current trip UI state. The API client also contains the Django trip and report integrations; when extending persistence or synchronization, keep the client storage behavior and backend ownership rules aligned.

### Backend

The Django project is in [`backend/`](./backend/), with project configuration in [`backend/config/`](./backend/config/).

| Django app | Responsibility |
| --- | --- |
| `accounts` | Registration, login, logout, CSRF initialization, current-user and profile APIs |
| `core` | Health endpoint and basic Django-rendered home/about views |
| `destinations` | Destinations, origins, places, accommodations, activities, transport, and search APIs |
| `trips` | Trip models, itinerary models, trip APIs, and cost calculation |
| `expenses` | Discounts and trip expense APIs |
| `reports` | CSV and PDF report services and endpoints |

The main URL configuration is [`backend/config/urls.py`](./backend/config/urls.py). API URL modules are kept close to their owning app:

- [`backend/accounts/urls.py`](./backend/accounts/urls.py)
- [`backend/destinations/urls.py`](./backend/destinations/urls.py)
- [`backend/trips/urls.py`](./backend/trips/urls.py)
- [`backend/core/api_urls.py`](./backend/core/api_urls.py)

## Data model

The central relationships are:

```text
User
  └── Trip
       ├── Origin
       ├── Destination
       │    ├── DestinationPricing
       │    ├── Place
       │    ├── Activity
       │    └── Accommodation
       ├── TransportOption
       ├── TripPlace --> Place
       ├── ItineraryDay
       │    └── ItineraryItem --> Place or Activity
       ├── Discount
       └── Expense
```

The backend model definitions are in:

- [`backend/destinations/models.py`](./backend/destinations/models.py)
- [`backend/trips/models.py`](./backend/trips/models.py)
- [`backend/expenses/models.py`](./backend/expenses/models.py)

Seed data is stored in [`backend/data/`](./backend/data/), including destination and transport master JSON files. The `seed_tripwise` management command loads the initial dataset.

## API reference

All API paths are relative to the backend host. In local development, that is normally `http://localhost:8000`.

### System and authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health/` | Check API and database connectivity |
| `GET` | `/api/auth/csrf/` | Initialize the CSRF cookie |
| `POST` | `/api/auth/register/` | Register and sign in a user |
| `POST` | `/api/auth/login/` | Start a session |
| `POST` | `/api/auth/logout/` | End the current session |
| `GET` | `/api/auth/me/` | Return the current authentication state |
| `GET`, `PUT`, `PATCH` | `/api/auth/profile/` | Read or update the current profile |

### Destinations and search

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/destinations/` | List destinations |
| `GET` | `/api/destinations/<id>/` | Get destination details |
| `GET` | `/api/destinations/<id>/places/` | List places for a destination |
| `GET` | `/api/destinations/<id>/accommodations/` | List accommodations |
| `GET` | `/api/destinations/<id>/activities/` | List activities |
| `GET` | `/api/transport/?origin=<origin>&destination=<destination>` | List matching transport |
| `GET` | `/api/search/destinations/?q=<query>` | Search destinations |
| `GET` | `/api/search/places/?q=<query>&destination=<id>` | Search places |
| `GET` | `/api/search/accommodations/` | Filter accommodations |
| `GET` | `/api/search/transport/` | Filter transport |

### Trips and expenses

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET`, `POST` | `/api/trips/` | List owned trips or create a trip |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/trips/<id>/` | Read, update, or delete an owned trip |
| `POST` | `/api/trips/<id>/calculate/` | Recalculate the cost breakdown |
| `GET`, `POST` | `/api/trips/<id>/places/` | List or add places |
| `DELETE` | `/api/trips/<id>/places/<place_id>/` | Remove a place |
| `GET`, `POST` | `/api/trips/<id>/expenses/` | List or add expenses |

### Reports

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/reports/trips/<id>/csv/` | Download trip CSV |
| `GET` | `/api/reports/trips/<id>/expenses/csv/` | Download expense CSV |
| `GET` | `/api/reports/trips/<id>/pdf/` | Download trip PDF |
| `GET` | `/api/reports/trips/<id>/expenses/pdf/` | Download expense PDF |

Mutating requests from the frontend include cookies and an `X-CSRFToken` header. On remote or production hosts the frontend uses same-origin `/api` requests; during local development it defaults to `http://localhost:8000` unless `VITE_API_BASE_URL` is set.

## Requirements

- Node.js and npm.
- Python 3.10 or newer.
- A modern browser with `localStorage` enabled.
- SQLite for the default local setup, or PostgreSQL for a deployed/shared environment.

The frontend dependency versions are declared in [`package.json`](./package.json). Python dependencies are pinned in [`backend/requirements.txt`](./backend/requirements.txt).

## Local development on Windows

Run the backend and frontend in separate terminals.

### 1. Set up the backend

```cmd
cd backend
py -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_tripwise
python manage.py runserver
```

The Django API is then available at `http://localhost:8000`.

If the seed command has already been run, it can be skipped. Use `python manage.py createsuperuser` if you need an admin account.

### 2. Set up the frontend

From the repository root, in a second terminal:

```cmd
npm install
npm run dev
```

Open `http://localhost:5173`.

If the backend runs at a different address, create a local `.env` file in the repository root:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Do not commit local `.env` files or production credentials.

### Useful development URLs

| URL | Purpose |
| --- | --- |
| `http://localhost:5173/` | React application |
| `http://localhost:8000/api/health/` | Backend health check |
| `http://localhost:8000/core/` | Django-rendered core page |
| `http://localhost:8000/admin/` | Django administration |

## Configuration

The backend reads configuration from environment variables in [`backend/config/settings.py`](./backend/config/settings.py).

| Variable | Purpose | Local default |
| --- | --- | --- |
| `SECRET_KEY` | Django signing and session secret | Development fallback in settings; set a unique value outside local development |
| `DEBUG` | Enables Django debug behavior | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1,[::1]` |
| `DATABASE_URL` | PostgreSQL or other database URL | SQLite database at `backend/db.sqlite3` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | Local Vite origins |
| `CSRF_TRUSTED_ORIGINS` | Origins trusted for CSRF-protected requests | Local Vite origins |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS | `False` |
| `SESSION_COOKIE_SAMESITE` | Session cookie SameSite policy | `Lax` |
| `CSRF_COOKIE_SAMESITE` | CSRF cookie SameSite policy | `Lax` |
| `EMAIL_BACKEND` | Django email backend | Console backend when `DEBUG` is enabled |

When `DATABASE_URL` is set, the backend uses `dj-database-url` and enables SSL for non-SQLite database URLs. In production, set a strong secret, configure allowed hosts and trusted origins, enable HTTPS, and do not use development fallback values.

## Frontend commands

```cmd
npm run dev       # Start the Vite development server
npm run build     # Type-check with tsc and create a production build
npm run lint      # Run Oxlint
npm run preview   # Serve the production build locally
```

## Backend commands

```cmd
cd backend
python manage.py test              # Run Django tests
python manage.py check             # Validate Django configuration
python manage.py makemigrations    # Create migrations after model changes
python manage.py migrate           # Apply migrations
python manage.py seed_tripwise     # Load TripWise seed data
python manage.py collectstatic     # Collect static files for deployment
```

The test suite covers authentication, model validation, ownership restrictions, cost calculations, API behavior, search permutations, and CSV/PDF report generation. Relevant tests are in the `tests.py` and `test_validation.py` files within the Django apps.

## Production and deployment notes

### Frontend hosting

The frontend is a Vite static build. Build it with:

```cmd
npm run build
```

[`vercel.json`](./vercel.json) configures Vercel rewrites so `/api/*` requests are forwarded to the deployed Django backend and non-API routes fall back to `index.html` for client-side routing.

### Backend hosting

The backend can run under Gunicorn and serves static files through WhiteNoise. A production deployment should:

1. Install [`backend/requirements.txt`](./backend/requirements.txt).
2. Provide `DATABASE_URL` for a managed PostgreSQL database.
3. Configure `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, CORS, and CSRF trusted origins.
4. Run migrations and the seed command as appropriate for the environment.
5. Run `python manage.py collectstatic`.
6. Start Gunicorn with the Django WSGI module, for example:

   ```cmd
   gunicorn config.wsgi:application
   ```

The project also includes ASGI configuration in [`backend/config/asgi.py`](./backend/config/asgi.py) for hosts that support ASGI deployment.

## Project layout

```text
TripWise/
├── backend/
│   ├── accounts/          Authentication and profiles
│   ├── config/            Django settings, WSGI, ASGI, and root URLs
│   ├── core/              Health endpoint and core views
│   ├── destinations/      Destination data, APIs, and search
│   ├── expenses/          Expenses, discounts, and expense API
│   ├── reports/           CSV/PDF report services and views
│   ├── trips/             Trips, itinerary, cost calculator, and APIs
│   ├── data/              JSON master data used for seeding
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3         Local development database
├── public/                Favicon and public SVG assets
├── src/
│   ├── components/        Shared UI and layout components
│   ├── context/           Auth, toast, and trip state providers
│   ├── data/              Frontend data and mock content
│   ├── hooks/              Reusable React hooks
│   ├── pages/             Route-level screens
│   ├── services/          API, budget, and browser-storage services
│   ├── types/             TypeScript domain types
│   └── utils/             Shared helpers
├── index.html
├── package.json
├── tailwind.config.js
├── vercel.json
└── vite.config.ts
```

## Contributing

1. Create a focused branch.
2. Keep frontend and backend changes consistent with the API contract.
3. Add or update tests for behavior changes, especially cost rules and ownership checks.
4. Run `npm run lint`, `npm run build`, and `python manage.py test` before opening a pull request.
5. Do not commit credentials, local databases containing sensitive data, virtual environments, build output, or `.env` files.

## Current limitations and future work

- The frontend currently persists its active trip workspace and saved places in browser storage; a future synchronization layer can make the server the single source of truth for all client trip mutations.
- AI assistant integration, including Gemini integration, is planned but is not part of the current application flow.
- Production deployment requires environment-specific security, database, domain, email, and observability configuration.
