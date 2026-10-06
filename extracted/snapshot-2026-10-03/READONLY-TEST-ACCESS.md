# Read-only test access for Splunk Doctor

This release is intended for an air-gapped RHEL host.

## Install

Copy the following files from the GitHub Actions artifact to USB media:

- `splunk-doctor-offline-rhel-1.5.1-complete.tar.gz`
- `splunk-doctor-offline-rhel-1.5.1-complete.tar.gz.sha256`

On the RHEL server:

```bash
cd /path/to/usb
sha256sum -c splunk-doctor-offline-rhel-1.5.1-complete.tar.gz.sha256
tar -xzf splunk-doctor-offline-rhel-1.5.1-complete.tar.gz
cd splunk-doctor
sudo bash setup.sh
```

The installer does not add broad inbound firewall rules. It installs the application, bundled prerequisites, systemd service, and private runtime data under `/var/lib/splunk-doctor`.

## Restrict web access

From the server, allow only the management workstation or subnet that should reach TCP/3000:

```bash
sudo bash scripts/restrict-web-access.sh 192.168.232.50
```

Replace `192.168.232.50` with the exact IPv4 address of the trusted test workstation. A CIDR can also be used when necessary, for example `192.168.232.0/24`.

Only TCP/3000 is exposed for the application UI/API. Splunk/parallel service ports are not opened by this helper.

## Create a temporary read-only test account

Log in to Splunk Doctor as the existing administrator and create a dedicated user with:

- Role: `auditor`
- Active: yes
- Never expires: no
- Short expiry (for example 1 day)
- Notes: `temporary offline diagnostic test account`

The `auditor` role is deliberately restricted. It cannot use remediation, restart Splunk, edit configurations, manage users, or manage licensing.

Additionally, the API layer has a hard server-side read-only boundary for auditor sessions: mutating POST/PUT/PATCH/DELETE routes are denied unless they are on the explicit diagnostic allowlist.

## Local verification

```bash
sudo systemctl status splunk-doctor --no-pager
curl -fsS http://127.0.0.1:3000/api/health
sudo ss -lntp | grep ':3000'
```

Authenticated diagnostic requests use the auditor account. A missing or invalid session must receive HTTP 401.

For example, without credentials:

```bash
curl -i http://127.0.0.1:3000/api/auth/me
```

The result must be `401 Unauthorized`.

## Important limitation

The production server remains air-gapped. A private RFC1918 address such as `192.168.232.101` is not directly reachable from the external ChatGPT execution environment. Direct testing by an external operator therefore requires a separately approved network path; do not expose the production/admin account or the SSH/root interface.

For this release, the safe path is to provide the exact authenticated test endpoint through an approved internal access mechanism, or to export the application's diagnostic/API results and logs for review.
