# IncidentAgent Model Demo Video Workflow

## What to show
A short end-to-end walkthrough of the Incident Response Agent: submit an incident, compare generic analysis with Hindsight memory, confirm the suggested fix, retain the resolution, and show that the memory dashboard updates.

## Before recording

1. Confirm `IncidentAgent/backend/.env` is present and contains valid `HINDSIGHT_API_KEY`, `HINDSIGHT_BASE_URL`, and `GROQ_API_KEY` entries. Keep the file and terminal output off camera.
2. Start the backend in its own PowerShell window from the repository root:

   ```powershell
   Set-Location .\IncidentAgent\backend
   .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

   If `.venv` does not exist yet, create it and install the listed requirements:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

3. Start the frontend in a second PowerShell window:

   ```powershell
   Set-Location .\IncidentAgent\frontend
   npm run dev -- --hostname 127.0.0.1
   ```

   Run `npm install` first if `node_modules` is missing.
4. Open `http://127.0.0.1:3000`. Wait for the dashboard to finish loading. The Memory State panel should show a Hindsight connection and current memory count before you begin.
5. Use a clean browser view and close unrelated windows. Keep both terminals minimized or outside the capture area.

## Recording sequence (about 2–3 minutes)

1. **Introduce the problem.** Show the Hindsight DevOps Agent dashboard and explain that it uses prior incident knowledge to guide a new diagnosis.
2. **Load a sample.** Under “Try a sample,” select **OOMKilled — Pod Restarts**. The title and error log should fill in. This sample has relevant prior image-processor incidents in the configured memory bank.
3. **Analyze.** Click **Analyze Incident** and wait for the diagnosis. Point out the suspected v2.4.1 image-processing memory leak, the references to previous OOM incidents, and the suggested rollback / memory-limit steps. The exact wording and references can vary with the live model response.
4. **Compare memory.** Click **⚡ Compare**. Show the “Without Memory” and “With Hindsight Memory” columns. Explain that the second answer can use the incident history returned from Hindsight. Wait for both answers before continuing.
5. **Resolve the incident.** In the root-cause field enter:

   ```text
   Memory leak in the v2.4.1 image-processing library when decoding large TIFF files.
   ```

   In the resolution field enter:

   ```text
   Rolled image-processor back to v2.4.0, increased the pod memory limit by 512 MiB, and tracked the permanent library patch.
   ```

   Click **Yes, Mark Resolved (Train Agent)** once.
6. **Show learning.** Wait for the success message. Point to the updated memory count / recent memories and the Incident History timeline. This confirms the resolution was retained.
7. **Close the loop (optional).** Click **Analyze Incident** again with the same sample. Show that Hindsight can recall the retained incident alongside earlier matches.
8. **Wrap up.** Summarize the loop: incident log → memory recall → diagnosis → verified resolution → retained knowledge for future incidents.

## What to speak while making the demo video

Use this as a natural narration guide. Pause while the model is responding, and describe the result you actually see on screen.

1. **Opening:** “When a production incident happens, engineers often have to search old tickets and runbooks before they can act. This Incident Response Agent uses Hindsight memory to bring relevant past incidents into the diagnosis.”
2. **Sample incident:** “I’m loading an OOMKilled alert from our image-processing service. The log shows the pod was terminated with exit code 137 while processing large files.”
3. **Analysis:** “The agent is checking the incident against its memory and asking the language model for a diagnosis. Here it connects the alert to earlier image-processor incidents and suggests a rollback and memory-limit changes.”
4. **Compare:** “This comparison shows a general answer alongside an answer informed by Hindsight. The memory-informed response can use our previous root causes and resolutions, so the guidance is grounded in the team’s incident history.”
5. **Resolve:** “After verifying the cause and fix, I’m recording what worked: the image-processing library had a memory leak, and we rolled back to version 2.4.0 while increasing the pod’s memory limit.”
6. **Learning:** “Marking the incident resolved retains that outcome in the memory bank. The updated memory count and incident history show that the agent has kept the new information.”
7. **Optional repeat analysis:** “I’ll run the same alert again to show the closed loop: the resolution we just recorded is now available as context for a future incident.”
8. **Closing:** “The workflow is: submit an error log, recall related incidents, get a diagnosis, record the verified resolution, and make that knowledge available next time.”

## Recording notes

- The model and Hindsight service are live dependencies; allow time for responses and make sure the Hindsight connection is available before recording.
- Keep API keys, `.env`, and detailed server logs off screen.
- Use the app’s sample buttons so the recording uses synthetic demo logs. Do not paste production logs or customer data into the demo.
- The memory bank already contains prior demo incidents, so the initial diagnosis can recall historical context before this recording's resolution is saved.
- If Compare or Analyze returns an error, check both terminal windows and the Hindsight / Groq connectivity, then retry once the services respond.
