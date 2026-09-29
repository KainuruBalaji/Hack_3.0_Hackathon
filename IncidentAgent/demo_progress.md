# Demo Testing Progress

## Completed
- [x] Analyzed the backend, frontend, setup instructions, and existing local edits.
- [x] Started the backend and frontend locally.
- [x] Ran the sample OOMKilled incident through analysis and Hindsight comparison.
- [x] Retained a synthetic resolution and confirmed the memory count/history updated.
- [x] Fixed bugs found during the walkthrough.
- [x] Added the recording steps in `DEMO_WORKFLOW.md`.
- [x] Verified `npm run lint` and `npx tsc --noEmit`.

## Bugs fixed
- Failed Hindsight recall no longer counts as a memory match.
- Memory stats now read the Hindsight SDK `items` fields and total count.
- Dashboard connection state and analysis API errors are visible.
- Removed an unsupported `ReactMarkdown` prop that failed TypeScript checking.

## Current state
- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Hindsight memory count after the demo retain: 104.
- Detailed evidence and resume notes: `../DEMO_PROGRESS.md`.
- Video workflow: `DEMO_WORKFLOW.md`.
