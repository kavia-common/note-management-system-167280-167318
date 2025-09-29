Ocean Notes Frontend - Backend Integration Guide

Overview
- This Qwik frontend is prepared to integrate with a notes backend (notes_database dependency).
- API stubs are provided in src/lib/api.ts and expect a PUBLIC_NOTES_API_URL environment variable.

Environment variable (do not hardcode in code)
- PUBLIC_NOTES_API_URL: Public base URL of the backend (e.g., https://api.example.com)
- Provide this variable via deployment orchestrator. See .env.example for reference.

Wiring API
- Replace local demo data in src/routes/index.tsx by calling:
  - fetchCategories()
  - fetchNotes({ categoryId, q })
  - createNote(), updateNote(), deleteNoteApi()
- These functions return safe fallbacks if the backend is not configured to avoid crashes during development.

Notes
- Keep UI interactions responsive; optimistically update local state and reconcile with backend responses when appropriate.
- Handle authentication/headers in src/lib/api.ts if required by backend later.
