# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Profile linking feature and public chef profile pages
- Recipe edit and rating functionality
- Admin interface with authentication
- Firebase Storage integration for recipe images
- Firebase workflow environment settings

### Changed

- Enhanced landing page design
- Updated chef routes and schemas for public profile endpoints
- Meal plan page improvements
- Fridge page improvements

---

## [0.2.1] - 2025-12-25

### Added

- Login and signup pages with basic
- Basic discover page
- Reusable UI components
- Base layout, landing page, and consistent padding
- Cloud Run deployment optimizations
- Recipe search, details, and favorites functionality
- Chef recipe management
- Unit conversion utility functions
- Fridge and Shopping List modules
- Meal Plan page and implementation
- Rate, review, and delete endpoints for recipes
- API schema validations
- OpenAPI integration with Swagger UI
- Python script for data loading
- Test infrastructure using pytest

### Changed

- Restructured database tables
- Refactored config loading and app structure
- Updated package versions and requirements

---

## [0.2.0] - 2025-12-21

### Added
- PostgreSQL integration and database schema updates
- SQLAlchemy models and DB initialization updates for PostgreSQL compatibility
- Authentication features: email verification, password-reset and verification model with mail settings
- Admin functionality: user listing, role management, delete and admin password-reset endpoints

### Changed
- Configuration and CI updates: database port and env values
- Refactors: auth and admin route updates

---

## [0.1.2] - 2025-11-30

### Added
- Composite Firestore indexes, PostgreSQL ERD documentation and schema files added
- Added requirements.txt, a new Config class, updated .gitignore
- Next.js static export, improved Firebase Hosting integration and deployment documentation
- Added GitHub Actions for automated Cloud Run deployment
- Enabled CORS and environment-based JWT secret
- Added Dockerfile and .dockerignore for Flask backend containerization
- Added /api/auth/login, /api/auth/register endpoints, JWT generation, role check endpoint
- User database connection

### Changed
- Added separate authentication step via google-github-actions/auth, removed service_account_key from setup-gcloud step
- fixed Docker image push authentication to GCR

---

## [0.1.1] - 2025-11-8

### Added
- Initial project structure with organized folders
- Backend folder containing Flask application (`app.py`)
- Frontend folder with React-compatible structure
- Database folder for Firestore configuration files
- GitHub Actions workflow for automatic branch deletion after merge
- CHANGELOG.md for tracking project changes

### Changed
- Moved `app.py` from root to `backend/` folder
- Moved `templates/` folder from root to `backend/` folder
- Moved `data/` folder from root to `backend/` folder
- Moved `firestore.rules` and `firestore.indexes.json` to `database/` folder
- Moved `build/` folder to `frontend/build/`
- Cleaned up unnecessary placeholder code from Firebase hosting workflows
- Fixed Firebase configuration files location (moved back to root as required by Firebase CLI)
- Updated file paths in `firebase.json` to reflect correct folder structure
- Removed npm cache from firebase-hosting-pull-request workflow (no package.json in root)

### Fixed
- Fixed logic error in auto-delete-branches workflow (removed unnecessary CURRENT_BRANCH check)

### Removed
- N/A

### Security
- N/A

---

## [0.1.0] - 2025-10-21

### Added
- Initial project setup
- Flask backend with meal filtering functionality
- HTML templates for meal listing and detail pages
- JSON data file with sample meals
- Firebase configuration for hosting and Firestore
- Basic project documentation

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A

### Security
- N/A
