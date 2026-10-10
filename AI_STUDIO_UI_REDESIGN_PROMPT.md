# Google AI Studio Build Prompt — Splunk Doctor Pilot UI Redesign

Act as a senior enterprise UX architect, React/TypeScript engineer, Splunk architect, network-observability specialist, and security-minded product designer.

## Inspect the Pilot project first

This repository contains the existing project archive named splunk-cluster-doctor-&-architecture-studio.zip. If possible, inspect the archive before coding and identify the current pages, navigation, topology/architecture views, health/diagnostic screens, configuration panels, API integrations, and UI components. If you cannot inspect the archive in your environment, say so clearly and build from this specification without inventing facts about the source.

## Non-negotiable scope

Build a frontend-only, isolated, interactive prototype in a new ui-redesign directory or a separate UI-only project.

- Do not overwrite, modify, delete, or repackage the original ZIP.
- Do not change the existing production application, backend/API contracts, RHEL packaging, systemd files, or server configuration.
- Do not deploy to the RHEL server or update the live Pilot instance.
- Do not connect to Splunk, SSH, private IP addresses, Docker, Kubernetes, databases, or production APIs.
- Do not run real network scans, shell commands, installations, restarts, firewall changes, or configuration changes.
- Use deterministic shared mock data only.
- Display “DEMO DATA — NOT CONNECTED” persistently on every prototype page.
- Never present mock data as real telemetry, verified health, measured latency, an open port, or official compatibility certification.
- Do not include credentials, tokens, private keys, or real production secrets.
- Deliver runnable source code and simple run/build instructions. Keep the prototype separate so it can be reviewed before integration.

## Product workflow

The redesigned app serves five connected purposes:
1. Discover an authorized network and identify hosts, neighbors, ports, observable connections, and Splunk relationships.
2. Show the discovered network and current Splunk architecture on a dedicated topology page.
3. Develop a separate target architecture by editing a copy of the discovered graph.
4. Diagnose the currently installed Splunk deployment, errors, configuration findings, service state, and health of all diagnostic tools.
5. Prepare secure installation/execution plans for authorized hosts, Docker, and Kubernetes, with all actions simulated in this first iteration.

Always distinguish Current Environment from Target Design. Editing the target must never mutate the current/discovered graph.

## Visual direction

Create a premium enterprise infrastructure-management product, not a generic dashboard:
- Persian is the default language with correct RTL; provide an English LTR toggle.
- Dark graphite/navy surfaces, restrained cyan/blue accents, readable typography, clear hierarchy, subtle borders, generous but efficient spacing.
- Use Vazirmatn or a similar Persian font and consistent professional icons.
- Green means verified/observed healthy only; amber means warning; red means confirmed error; gray means unknown/unavailable/not checked.
- Desktop-first responsive layout that also works on tablet/mobile.
- Include focus states, accessible controls, useful tooltips, and loading, partial, error, empty, unknown, and permission-required states.
- Avoid overcrowded navigation, decorative gauges, random figures, fake latency, and unsupported health/compliance scores.
- Every visible navigation item, button, tab, filter, and dialog must have a meaningful prototype interaction.

## Primary navigation

Use exactly these five main destinations:
1. Network Discovery & Topology
2. Architecture Studio
3. Current Splunk Health
4. Installation & Execution
5. Reports & Audit History

Keep secondary diagnostic tools within their relevant workspace.

## 1. Discovery-first startup

On first opening the prototype, simulate a discovery sequence locally. No packets or API requests may be sent.

Stages:
1. Inspect example local interfaces, addresses, and routes.
2. Identify sample neighbors and gateways.
3. Inspect an example authorized port/service profile.
4. Gather example connection evidence.
5. Identify Splunk roles and configuration-derived relationships.
6. Construct a topology model.

Show a scope-review panel with a safe example CIDR explicitly marked as mock data, a discovery profile, progress, start/retry/cancel controls, summary, and partial/error states.

Show distinct counters for discovered hosts, reachable hosts, ports inspected, confirmed open ports, actually observed connections, config-derived relationships, inferred/unverified links, and unresolved checks. Identify the local controller separately and exclude it from the neighbor count.

Visually distinguish:
- discovered versus reachable hosts;
- confirmed open versus filtered/unknown ports;
- local socket observations versus network-wide flow telemetry;
- observed connections versus relationships extracted from configuration;
- inferred versus verified links.

Do not imply that a single server's local socket table reveals all traffic between all network hosts. Network-wide visibility requires suitable authorized probes, agents, flow records, or network telemetry.

Every mock node and edge must have provenance and a verification state. “Not observed” must not mean “does not exist”.

## 2. Dedicated topology page

After the simulated discovery, navigate to a separate topology view. The graph should be the main focus.

Provide three layers:
- Network Topology
- Current Splunk Architecture
- Connections & Ports

Show nodes present in the shared dataset, such as gateway/hosts and applicable Splunk roles: Indexer, Search Head, Heavy Forwarder, Universal Forwarder, Cluster Manager, Deployment Server, License Manager, HEC, and related components.

Graph controls:
- Zoom, pan, fit to screen.
- Search hostname/IP.
- Filters by role/type/status/relationship provenance/port.
- Select a node for a details inspector.
- Select an edge to inspect relationship details.
- An accessible table/list view.
- Prototype-only export controls.

A node inspector displays sample identity/IP, role, evidence source, last-observed time or “not measured”, relevant services/ports, and verification state. An edge inspector displays source, destination, known protocol/port, provenance, evidence, and verification status.

Use clearly different edge styling for observed, configuration-derived, inferred, and unverified relationships.

At the end of the topology page, show exactly two prominent next-step cards:

A. Develop Architecture
“Create a target design from a separate copy of the discovered topology. Add components, define operating system and hardening, choose Splunk roles and versions, and edit role-specific configurations.”

B. Current Splunk Health & Diagnostics
“Inspect the currently installed environment: services, versions, errors, configuration findings, network evidence, and diagnostic-tool status.”

Each choice must open a different workspace. Do not mix the current diagram with target design.

## 3. Architecture Studio

Build a professional visual editor with:
- Left component palette.
- Center draggable graph canvas.
- Right-side component inspector.
- Bottom/side panels for configuration editor, validation, diffs, and design history.

Initialize it with an independent copy of the discovered graph. Support adding, selecting, moving, connecting, and removing prototype components. Keep IDs stable and add reset-to-discovered-copy/undo where practical.

Component palette:
- Indexer / Indexer Cluster
- Search Head / Search Head Cluster
- Heavy Forwarder / Universal Forwarder
- Cluster Manager
- Deployment Server
- License Manager
- Monitoring Console
- HEC / Syslog
- Load balancer / storage
- Docker runtime
- Kubernetes cluster

For each selected component provide requirements for:

Operating system and host:
- Linux distribution/release.
- CPU, RAM, disk and storage sizing.
- Required packages/dependencies/system services.
- Dedicated service account and permissions.

Hardening:
- SELinux policy/posture.
- Role-required firewall ports.
- Identity, least privilege, certificate and TLS requirements.
- OS hardening profile and rationale.
- Required, recommended, and optional distinctions.

Splunk:
- Product/component role and version selection.
- Dependencies and upstream/downstream relationships.
- Role-specific settings and required ports.
- Resource/storage assumptions.

Never invent a supported OS/Splunk version combination. Mark example choices as “sample — compatibility not validated against official documentation”.

### Critical: Splunk-like configuration workbench

Make the experience resemble the practical workflow of Splunk Web and Splunk CLI without pretending it is the actual Splunk console.

Include both structured forms and an editable raw sample configuration editor. Provide appropriate tabs for:
server.conf, inputs.conf, outputs.conf, indexes.conf, props.conf, transforms.conf, web.conf, plus role-specific settings where applicable.

Provide:
- Component/role and target-node context.
- Field help.
- CLI command preview clearly marked “preview only — not executed”.
- Validation messages and conflict/missing-setting warnings.
- Unsaved-change state.
- Before/after diff.
- Local save in prototype state.
- Current configuration as read-only sample; target configuration as editable sample.

Do not write settings to a host or send them to Splunk. Do not claim validation succeeded unless a real validation was run; in the prototype validation is simulated and must be labelled.

## 4. Current Splunk Health & Diagnostics

This section concerns the existing installed environment, not Architecture Studio.

Create tabs:
1. Overview
2. Services & Versions
3. Configuration Audit
4. Logs & Errors
5. Network & Connections
6. Tool Health
7. Reports & History

Show availability, version/install path where known, config/btool findings, log warnings/errors, CPU/RAM/disk/uptime when present, listening ports, configured Splunk destinations, and the state of each diagnostic tool.

Every finding should expose source, observation timestamp, evidence and recommended next action. Use Healthy, Warning, Error, Unknown, Unavailable, Permission Required, and Partial states.

Missing telemetry, API errors, and insufficient permissions must never display as healthy. No random latency, fabricated success fallback, or unsupported compliance score. Label all sample and historical values as mock/demo.

## 5. Installation & Execution planning

Create a workspace for future operations on authorized hosts, Docker and Kubernetes. All actions in this prototype must remain simulated.

Include target inventory and explicit target selection, per-target access status, prerequisites, OS/hardening plan, Splunk installation/configuration stages, Docker/Kubernetes cluster or namespace view, network-path/port preview, dry-run, validation, backup/rollback, approval, progress/logs, and audit history.

Show secure architecture concepts:
- Authenticated and auditable access.
- mTLS or equivalent workload identity where appropriate.
- Least privilege, target allow-lists, RBAC, credential rotation.
- Scoped Kubernetes ServiceAccounts and RBAC.
- No unauthenticated shell endpoint.
- No unauthenticated Docker remote API.
- Explicit separation of read-only discovery and privileged writes.
- Do not assume that opening one port grants complete or safe access.

Do not run real commands, open sockets, install packages, change firewalls, restart services, or connect to clusters.

## 6. Reports & Audit History

Create a searchable/filterable history of sample discovery sessions/scopes, topology snapshots, architecture revisions, validation findings, deployment plans/approvals, and diagnostic reports.

Show time, source, actor placeholder, target, status, evidence summary, and ID. Label every record as mock data. Export/copy actions remain frontend-only.

## Shared mock data and implementation

Use one deterministic typed mock dataset shared by all screens. Graph nodes, edges, counts, node details, tables, and report entries must derive from the same source. Suggested types: Host, Interface, PortObservation, ConnectionEvidence, SplunkComponent, Relationship with provenance/verification, DiscoveryRun, ArchitectureNode, ConfigDocument, Finding, ToolStatus, DeploymentPlan, and AuditRecord.

Use React/TypeScript and follow the original project's conventions where practicable, but keep the new prototype isolated. Prefer existing dependencies and avoid unnecessary package changes. Include a short README with run/build instructions.

## Definition of done

Test:
- All five primary navigation destinations.
- Discovery simulation progress, cancel/retry, partial/error states.
- Graph layer switching, search/filter, node and edge inspectors.
- Adding/editing/removing target components without mutating the current graph.
- Configuration preview, diff, simulated validation and unsaved state.
- All diagnostic tabs and error/unknown/partial states.
- Simulated deployment plan and confirmation gate.
- Persian RTL, English LTR, and responsive layout.
- Available build/lint commands and browser console errors.

Deliver a reviewable, runnable frontend prototype plus a concise summary and remaining integration work. Do not deploy to production or connect to real infrastructure.
