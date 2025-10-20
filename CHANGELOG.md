# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.1.0] - 2024-10-21

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
