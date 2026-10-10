# Splunk Doctor Pilot — Google AI Studio UI Redesign

This branch prepares the **Pilot** repository for a frontend-only redesign prototype.

## Start here

1. Open AI_STUDIO_UI_REDESIGN_PROMPT.md.
2. Open Google AI Studio Build mode.
3. Provide this Pilot repository and the existing project archive, splunk-cluster-doctor-&-architecture-studio.zip, as source/reference if the UI allows it.
4. Paste the full prompt from AI_STUDIO_UI_REDESIGN_PROMPT.md.
5. Ask for a separate ui-redesign/ prototype; do not overwrite the live Pilot application.
6. Review the result against UI_REDESIGN_ACCEPTANCE.md.

## What must remain unchanged

- The existing ZIP archive is the source/reference project in this repository.
- Keep the original archive unchanged.
- Do not change the production app, backend/API contracts, RHEL packaging, systemd service, or live server.
- The first deliverable is an isolated, runnable frontend prototype using clearly labeled mock data only.
- Real network discovery, Splunk API integration, Docker/Kubernetes access, installation and restart workflows are out of scope for this UI-only iteration.

## Target experience

1. Discovery-first startup flow.
2. Dedicated discovered-network and current Splunk topology.
3. Two clear next steps: Develop Architecture or Current Splunk Health & Diagnostics.
4. Architecture Studio with a separate target design, OS/hardening/Splunk role requirements, and Splunk-like configuration editor.
5. Current Splunk health, errors, configuration audit and tool-health status.
6. Secure installation/execution planning for future authorized Docker/Kubernetes/host operations.
7. Reports and audit history.

No UI-only mock result should be presented as real telemetry or successful validation.
