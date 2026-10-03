# Real Offline Control Plane Integration

This branch keeps the existing Dr-Splunk UI/navigation/components and replaces selected simulated execution paths with real, verifiable host operations.

## Runtime contract

The controller is expected to run as root on the RHEL management host. The UI calls the existing API surface; the new control plane is under `/api/real/*`.

Implemented real paths:

- `POST /api/real/network/scan`: reads `ip -json`, `ss`, neighbor table and optionally probes a bounded IPv4 CIDR.
- `POST /api/real/node/probe`: TCP probes plus optional SSH inventory.
- `POST /api/real/hardening/plan`: host posture checks.
- `POST /api/real/hardening/apply`: backup + selected sysctl/limits/firewalld/chrony changes.
- `POST /api/real/deploy/remote-hardening`: executes a controlled baseline over SSH and reports the actual exit code.
- `GET /api/real/splunk/preflight`: detects Splunk, version, status and ports.
- `POST /api/real/splunk/control`: start/stop/restart and re-check status.
- `POST /api/real/deploy/direct`: installs a locally staged licensed RPM/TGZ; no internet fallback.
- `POST /api/real/deploy/container`: loads a local image archive and starts Splunk with Podman/Docker.
- `POST /api/real/deploy/kubernetes`: applies an offline Kubernetes manifest using an installed kubectl and waits for rollout.
- `GET /api/real/splunk/topology`: reads actual inputs.conf/outputs.conf.
- `POST /api/real/overseer/step`: executes real environment, architecture, btool, port, security and final verification steps.
- `POST /api/real/validate/cluster`: probes declared cluster nodes and reports PASS/DEGRADED.
- `GET /api/real/artifacts`: reports locally staged artifacts.

## Deliberate non-simulation rule

A missing Splunk binary, missing package/image, failed SSH connection, failed Kubernetes rollout, or failed command is reported as a failure. The backend no longer reports a successful "sandbox" action for those cases.

OS installation is not falsely marked complete without an actual provisioning channel. Bare-metal provisioning needs valid Redfish/IPMI/PXE access and an OS installation media/artifact that the target can reach.

Splunk Enterprise packages/images and any commercial license remain operator-supplied artifacts for air-gapped deployment.

## UI preservation

No navigation section was removed or renamed. The existing Fleet, Overseer and Network Map components were wired to the real backend without introducing a replacement UI.

## Validation limitation

This environment cannot resolve GitHub from the local build container, so a full `npm install && npm run lint` build was not executable here. The branch is intentionally a draft PR until the repository owner runs the RHEL/offline build with its staged dependencies.
