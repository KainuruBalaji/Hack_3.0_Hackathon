# Model Demo Progress

## Objective
Run the IncidentAgent model demo end to end, fix bugs found during the walkthrough, and document a reliable video-demo workflow.

## Progress
- [x] Inspect the project, README, frontend instructions, app code, and existing local edits.
- [x] Start and inspect the dashboard and local API.
- [x] Walk through a representative model analysis and compare flow.
- [x] Retain a synthetic sample resolution and confirm Hindsight memory/history updates.
- [x] Fix bugs found during the walkthrough and validate the frontend.
- [x] Write recording-ready workflow steps in `IncidentAgent/DEMO_WORKFLOW.md`.

## Bugs and fixes
- Hindsight recall failures were encoded as a nonempty string, making the API report a successful memory match even when nothing was recalled. Failed recall now produces no match.
- The installed Hindsight SDK returns memory and mental-model collections in `items`; the dashboard expected `results`, so it displayed zero memories. The backend now supports `items` and reads the total count from the response.
- The dashboard always showed “Hindsight Connected” and hid HTTP analysis errors. It now reflects the backend connection status and displays returned analysis errors.
- TypeScript rejected a `className` prop passed to ReactMarkdown. Removed the unsupported prop.

## Validation and demo evidence
- Backend startup succeeded; `/`, `/api/memory/stats`, `/api/incident/history` returned HTTP 200.
- Live OOMKilled sample analysis returned `past_incidents_recalled: true` and referenced prior image-processor OOM incidents.
- Compare flow returned both a generic answer and a Hindsight-informed answer, with `incidents_recalled: true`.
- Retain flow returned success. Memory count updated from 102 to 104 and history returned 100 entries.
- `npm run lint` and `npx tsc --noEmit` passed.
- The user’s existing uncommitted code edits were preserved. Backend dependencies are installed in the ignored project-local `IncidentAgent/backend/.venv`.

## Run state / resume notes
- The demo services are running locally at `http://127.0.0.1:3000` and `http://127.0.0.1:8000`.
- The in-app browser interaction was blocked by its browser URL policy after it showed a “site can’t be reached” page; the app itself is now available and its API was exercised directly.
- To continue the UI walkthrough, open or refresh `http://127.0.0.1:3000` in a normal browser and follow `IncidentAgent/DEMO_WORKFLOW.md`.
