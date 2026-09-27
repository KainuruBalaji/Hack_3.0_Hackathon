# 🛠️ Implementation Plan for Gemini Agent

**Project Root:** `c:\Users\kainu\Documents\LLM\HACK3.0\IncidentAgent`
**Goal:** Implement all improvements from the audit, one task at a time, without breaking existing functionality.

> [!IMPORTANT]
> **Rules for the Agent:**
> - Complete tasks IN ORDER (Task 1, then Task 2, etc.).
> - Each task specifies EXACTLY which file(s) to touch. Do NOT edit any other files.
> - After editing a file, verify the app still runs before moving to the next task.
> - Never delete existing working code — only add to it or replace specific sections.

---

## Task 1: Add 15 more seed incidents to `generate_data.py`

**File to edit:** `backend/generate_data.py`
**What to do:** Add 15 more incident dictionaries to the `synthetic_incidents` list (append after the existing 5). Keep the same schema: `incident_id`, `symptoms`, `error_log`, `root_cause`, `resolution`.
**Do NOT:** Change any other code in the file. Do not change the BANK_ID, the Hindsight connection logic, or the retain loop.

**Incidents to add (cover these categories):**
1. `INC-1006` — Kubernetes CrashLoopBackOff due to missing config map
2. `INC-1007` — SSL/TLS certificate expired on load balancer
3. `INC-1008` — DNS resolution failure for internal service discovery
4. `INC-1009` — Disk space full on /var/log causing application crash
5. `INC-1010` — Kafka consumer lag causing delayed order processing
6. `INC-1011` — MongoDB replica set election causing temporary write failures
7. `INC-1012` — API rate limiting from third-party payment gateway (Stripe)
8. `INC-1013` — Docker container running out of file descriptors (ulimit)
9. `INC-1014` — Elasticsearch cluster red status due to unassigned shards
10. `INC-1015` — JWT token validation failure after secret rotation
11. `INC-1016` — Memory spike in Java service due to GC thrashing
12. `INC-1017` — S3 bucket permission denied after IAM policy change
13. `INC-1018` — gRPC deadline exceeded between microservices
14. `INC-1019` — Terraform state lock causing deployment pipeline to hang
15. `INC-1020` — Load balancer health check failing due to changed health endpoint path

Each incident should have realistic, technical error log text (2-3 lines), a specific root cause (1-2 sentences), and a concrete resolution (2-3 sentences).

**After editing:** Run `python generate_data.py` from the `backend/` directory to push the new incidents to Hindsight.

---

## Task 2: Add `/api/memory/stats` endpoint to the backend

**File to edit:** `backend/main.py`
**What to do:** Add a NEW endpoint at the bottom of the file (after the existing `/api/incident/resolve` route). Do NOT modify any existing endpoints.

**Add this endpoint:**
- `GET /api/memory/stats`
- It should call `hindsight_client.list_memories(bank_id=BANK_ID)` to get stored memories.
- It should call `hindsight_client.list_mental_models(bank_id=BANK_ID)` to get mental models.
- Return a JSON object with:
  - `total_memories`: integer count of memories
  - `memories`: list of the most recent 10 memory content strings
  - `mental_models`: list of mental model content strings (may be empty)

**Handle exceptions gracefully** — if `list_memories` or `list_mental_models` fails, return empty lists and a count of 0.

**Do NOT:** Change the existing `/api/incident/analyze` or `/api/incident/resolve` endpoints. Do not change any imports, middleware, or client initialization code.

---

## Task 3: Add `/api/incident/history` endpoint to the backend

**File to edit:** `backend/main.py`
**What to do:** Add ANOTHER new endpoint after the one from Task 2.

**Add this endpoint:**
- `GET /api/incident/history`
- It should call `hindsight_client.recall(bank_id=BANK_ID, query="incident resolution")` to retrieve a broad set of past incidents.
- Return a JSON object with:
  - `incidents`: list of objects, each with `content` (the full text of the memory)

**Do NOT:** Change any existing endpoints or code from Task 2.

---

## Task 4: Fix the Resolve flow — let user input real root cause & resolution

**File to edit:** `frontend/src/app/page.tsx`
**What to do:** Modify ONLY the resolve-related code. Do NOT touch the header, the incident intake form, or the memory dashboard sidebar.

**Specific changes:**
1. Add two new state variables at the top (after existing state vars):
   - `const [rootCause, setRootCause] = useState('');`
   - `const [resolution, setResolution] = useState('');`

2. In the `resolveIncident` function, replace the hardcoded `root_cause` and `resolution` in the `body: JSON.stringify(...)` with the new state variables `rootCause` and `resolution`.

3. In the JSX, find the section with the "Did this resolution fix the problem?" text and the green button. REPLACE that section with:
   - A text input labeled "What was the root cause?" bound to `rootCause`
   - A textarea labeled "What was the resolution?" bound to `resolution`
   - Keep the existing green "Yes, Mark Resolved (Train Agent)" button, but disable it if `rootCause` or `resolution` are empty.
   - After successful resolve, clear all form fields and show a success message (replace `alert()` with setting a `resolveSuccess` state variable that shows a green banner).

**Style the new inputs** to match the existing dark-mode styling: `bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-emerald-500/50`.

**Do NOT:** Change the header, the incident intake textarea, the analyze button, the loading spinner, or the memory dashboard sidebar.

---

## Task 5: Install `react-markdown` and render diagnosis as Markdown

**File to edit:** `frontend/src/app/page.tsx`
**Pre-step:** Run `npm install react-markdown` in the `frontend/` directory.

**What to do:**
1. Add `import ReactMarkdown from 'react-markdown';` at the top of the file.
2. Find the diagnosis rendering section (currently `diagnosis.split('\n').map(...)` around line 126).
3. Replace it with: `<ReactMarkdown className="prose prose-invert max-w-none">{diagnosis}</ReactMarkdown>`

**Do NOT:** Change any other part of the file. Only replace the diagnosis rendering block.

---

## Task 6: Fetch real memory data in the sidebar (replace hardcoded text)

**File to edit:** `frontend/src/app/page.tsx`
**What to do:** Modify ONLY the Memory Dashboard sidebar section.

**Specific changes:**
1. Add new state variables:
   - `const [memoryStats, setMemoryStats] = useState({ total_memories: 0, memories: [], mental_models: [] });`

2. Add a `useEffect` hook (import `useEffect` from React) that fetches from `http://localhost:8000/api/memory/stats` on component mount and after every successful resolve. Store the result in `memoryStats`.

3. In the sidebar JSX, replace the hardcoded mental model text with:
   - Show `memoryStats.total_memories` as the count (e.g., "5 incidents in memory").
   - If `memoryStats.mental_models` has items, map over them and display each one.
   - If `memoryStats.mental_models` is empty, show the existing hardcoded text as fallback with a label "(Seeded knowledge)".
   - Show `memoryStats.memories` as a scrollable list of recent memory snippets (first 100 chars of each, truncated).

**Do NOT:** Change the header, the incident intake form, or the diagnosis/resolve section.

---

## Task 7: Add Incident History section to the UI

**File to edit:** `frontend/src/app/page.tsx`
**What to do:** Add a NEW section BELOW the existing grid (after the closing `</div>` of the `grid grid-cols-1 lg:grid-cols-3` div, but still inside the `max-w-7xl` container).

**Add:**
1. A new state variable: `const [incidentHistory, setIncidentHistory] = useState([]);`
2. Fetch from `http://localhost:8000/api/incident/history` inside the existing `useEffect` from Task 6.
3. Render a new card titled "📜 Incident History — Agent Learning Timeline" with:
   - A horizontal scrollable timeline or a vertical list.
   - Each item shows a truncated snippet of the incident content.
   - Style it with the same dark-mode card styling as the rest of the app.
   - If the list is empty, show "No incidents resolved yet. The agent is waiting to learn."

**Do NOT:** Change any existing sections. This is purely additive.

---

## Task 8: Add root `.gitignore`

**File to create:** `IncidentAgent/.gitignore` (at the project root)
**What to do:** Create a new file with:

```
# Environment variables (API keys)
.env
.env.*

# Python
__pycache__/
*.pyc
*.pyo
venv/
.venv/

# Node
node_modules/
.next/
out/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

**Do NOT:** Modify any other files.

---

## Task 9: Final verification

**What to do:**
1. Stop and restart the backend: `python -m uvicorn main:app --port 8000 --reload`
2. Stop and restart the frontend: `npm run dev` (in `frontend/`)
3. Open `http://localhost:3000`
4. Test the full flow:
   - Paste an error log → Click Analyze → See Markdown-rendered diagnosis
   - Type a root cause and resolution → Click Resolve → See success banner
   - Check the Memory Dashboard sidebar — it should show real data
   - Check the Incident History section at the bottom — it should populate
5. Verify `http://localhost:8000/api/memory/stats` returns real data
6. Verify `http://localhost:8000/api/incident/history` returns data

---

## Execution Order Summary

```
Task 1 → backend/generate_data.py (add data + run it)
Task 2 → backend/main.py (add /api/memory/stats endpoint)
Task 3 → backend/main.py (add /api/incident/history endpoint)
Task 4 → frontend/src/app/page.tsx (fix resolve form)
Task 5 → frontend/src/app/page.tsx (add react-markdown)
Task 6 → frontend/src/app/page.tsx (real memory data in sidebar)
Task 7 → frontend/src/app/page.tsx (add incident history section)
Task 8 → .gitignore (new file)
Task 9 → Test everything
```

> [!CAUTION]
> Tasks 4, 5, 6, 7 all edit the same file (`page.tsx`). They MUST be done sequentially, not in parallel. Each task builds on the previous one.
