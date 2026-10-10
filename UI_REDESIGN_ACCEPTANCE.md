# Splunk Doctor Pilot — UI Redesign Acceptance Checklist

Review the Google AI Studio prototype against this checklist before integration.

## Safety and isolation
- [ ] Prototype is isolated under ui-redesign/ or a separate project.
- [ ] Original Pilot ZIP, production application, backend, packaging, systemd, and live server are unchanged.
- [ ] No real network scan, Splunk API call, SSH, Docker/Kubernetes execution, install, restart, or firewall change.
- [ ] Every page shows “DEMO DATA — NOT CONNECTED”.
- [ ] No secrets, tokens, private keys, or production targets are included.

## Discovery and topology
- [ ] Discovery is the initial flow and remains simulated.
- [ ] Controller is excluded from the neighbor count.
- [ ] Discovered/reachable hosts, inspected/open ports, observed connections, config-derived links, inferred links, and unknowns are distinct.
- [ ] Scope, progress, cancel/retry, partial and error states work.
- [ ] Nodes/edges expose provenance and verification status.
- [ ] Dedicated graph layers: Network, Current Splunk, Connections & Ports.
- [ ] Exactly two prominent next steps: Develop Architecture and Current Splunk Health & Diagnostics.
- [ ] No claim that one host's local socket table reveals all network-wide traffic.

## Architecture Studio
- [ ] Target design is independent from Current Environment.
- [ ] Components can be added, selected, connected, moved and removed in prototype state.
- [ ] OS/release, resources, hardening, Splunk role/version, dependencies and ports have fields.
- [ ] Structured forms and raw sample config editor are both available.
- [ ] CLI commands are preview-only.
- [ ] Current config is read-only sample; target config is editable sample.
- [ ] Diff, unsaved state and simulated validation are clear.
- [ ] Example compatibility/sizing is labelled unverified.

## Current Splunk Health
- [ ] Tabs for overview, services/versions, audit, logs/errors, network/connections, tool health, and reports/history.
- [ ] Missing data, API failure, and insufficient permissions never show green/healthy.
- [ ] Findings show source, time, evidence, and next action.
- [ ] No random latency or fabricated success fallback.

## Installation/execution
- [ ] Explicit target inventory and access state.
- [ ] Preflight, dry-run, approval, backup/rollback, logs, progress and audit are visible.
- [ ] Least privilege, authentication, RBAC and target allow-lists are represented.
- [ ] All Docker/Kubernetes operations are simulated.
- [ ] No unauthenticated shell or Docker API pattern.

## UX and technical quality
- [ ] Five primary destinations work.
- [ ] All visible buttons/tabs/filters/dialogs/graph controls work.
- [ ] One shared mock data model drives nodes, edges, tables, counts, and reports.
- [ ] Persian RTL and English LTR work.
- [ ] Responsive desktop/tablet/mobile layout works.
- [ ] Build/lint checks are run where possible; incomplete items are documented.
