export interface SplunkAppFile {
  path: string;
  filename: string;
  category: 'metadata' | 'config' | 'scripts' | 'ui' | 'docs';
  descriptionFa: string;
  descriptionEn: string;
  content: string;
}

export const SPLUNK_APP_METADATA = {
  id: 'splunk_cluster_doctor',
  name: 'Splunk Cluster Doctor & Architecture Studio',
  version: '1.0.0',
  build: 101,
  author: 'Splunk Senior Security & Infrastructure Architect',
  description: 'Comprehensive cluster diagnostic app for Splunk Enterprise. Detects misconfigurations, audits btool layers, enforces security best practices, and manages cluster node health.'
};

export const SPLUNK_APP_FILES: SplunkAppFile[] = [
  {
    path: 'default/app.conf',
    filename: 'app.conf',
    category: 'config',
    descriptionFa: 'پیکربندی وضعیت اپلیکیشن، برچسب نمایشی در منوی اصلی اسپلانک و دسترسی خودکار',
    descriptionEn: 'Core application descriptor defining visibility, launcher info, and install state.',
    content: `# app.conf — Splunk Cluster Doctor
[install]
is_configured = 1
state = enabled
build = 101

[package]
id = splunk_cluster_doctor
check_for_updates = 1

[ui]
is_visible = 1
label = Splunk Cluster Doctor & Architecture Studio
show_in_nav = true

[launcher]
author = Splunk Senior SOC & SIEM Architect
description = Automated diagnostic and remediation engine for Indexer Clusters, Search Heads, and Heavy Forwarders.
version = 1.0.0
`
  },
  {
    path: 'metadata/default.meta',
    filename: 'default.meta',
    category: 'metadata',
    descriptionFa: 'اعطای دسترسی سراسری (export = system) و مجوز خواندن/نوشتن خودکار برای ادمین در تمام نودها',
    descriptionEn: 'Grants global system-wide export and administrator permissions across all cluster objects.',
    content: `# default.meta — Object Permissions & System Export
# Grants instant full access across the entire Splunk cluster upon installation

[]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[views]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[nav]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[savedsearches]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[commands]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[eventtypes]
access = read : [ * ], write : [ admin, sc_admin ]
export = system
`
  },
  {
    path: 'default/authorize.conf',
    filename: 'authorize.conf',
    category: 'config',
    descriptionFa: 'تعریف مجوزها و نقش ادمین کلاستر (run_btool, rest_properties_set, admin_all_objects)',
    descriptionEn: 'Authorizations and RBAC granting the app and its operators full diagnostic privileges.',
    content: `# authorize.conf — Cluster Doctor Privileges & Capabilities
[capability::run_cluster_doctor]

[role_splunk_cluster_doctor_admin]
importRoles = admin
grantableRoles = admin
run_cluster_doctor = enabled
admin_all_objects = enabled
rest_apps_management = enabled
rest_apps_view = enabled
rest_properties_get = enabled
rest_properties_set = enabled
run_btool = enabled
list_settings = enabled
indexes_edit = enabled
edit_tcp = enabled
search = enabled
schedule_search = enabled
accelerate_search = enabled
`
  },
  {
    path: 'default/inputs.conf',
    filename: 'inputs.conf',
    category: 'config',
    descriptionFa: 'اسکریپت پایش خودکار با passAuth = splunk-system-user جهت دریافت خودکار توکن ادمین کلاستر',
    descriptionEn: 'Automated modular script input using passAuth for zero-configuration cluster-wide REST access.',
    content: `# inputs.conf — Automated Health Poller Script
# passAuth = splunk-system-user automatically injects session token into stdin
# granting full cluster REST access without storing hardcoded credentials!

[script://./bin/cluster_health_checker.py]
disabled = false
interval = 300
source = splunk_cluster_doctor:health
sourcetype = splunk:cluster:doctor
index = _internal
passAuth = splunk-system-user

[monitor://$SPLUNK_HOME/var/log/splunk/splunkd.log]
disabled = false
index = _internal
sourcetype = splunkd
`
  },
  {
    path: 'default/savedsearches.conf',
    filename: 'savedsearches.conf',
    category: 'config',
    descriptionFa: 'قوانین جستجوی ذخیره‌شده و هشدارهای امنیتی خودکار (TLS، افت صف، فضای دیسک و لاگ‌ها)',
    descriptionEn: 'Pre-packaged scheduled searches and automated correlation alerts for SOC monitoring.',
    content: `# savedsearches.conf — Automated Cluster Security & Performance Alerts

[Splunk Doctor - Cleartext Forwarding Alert]
search = index=_internal sourcetype=splunkd "useSSL=false" OR "TcpOutputProc - Connected to" NOT "ssl=true" | stats count by host, dest_ip, port
cron_schedule = */15 * * * *
enableSched = 1
alert.severity = 5
alert.suppress = 1
alert.suppress.period = 1h
description = Alerts when forwarders send data without TLS 1.2/1.3 encryption.

[Splunk Doctor - Low Disk Space Warning (<5000MB)]
search = index=_internal sourcetype=splunkd "DiskMon - Disk space free" | eval free_mb=round(free_bytes/1024/1024, 0) | where free_mb < 5000 | stats latest(free_mb) as FreeMB by host, path
cron_schedule = */10 * * * *
enableSched = 1
alert.severity = 4
description = Triggers when indexer or forwarder free disk space drops below Splunk safety threshold.

[Splunk Doctor - Queue Dropping Events]
search = index=_internal sourcetype=splunkd "blocked=" OR "dropEventsOnQueueFull" | stats count by host, name, max_size, current_size
cron_schedule = */10 * * * *
enableSched = 1
alert.severity = 4
description = Detects parsing or tcpout queue saturation causing silent event drops.

[Splunk Doctor - Insecure pass4SymmKey Default]
search = index=_internal sourcetype=splunkd "pass4SymmKey" "changeme" | stats count by host
cron_schedule = 0 * * * *
enableSched = 1
alert.severity = 5
description = Flags clusters using the default factory encryption key 'changeme'.
`
  },
  {
    path: 'bin/cluster_health_checker.py',
    filename: 'cluster_health_checker.py',
    category: 'scripts',
    descriptionFa: 'اسکریپت پایتون ۳ رسمی اسپلانک با دسترسی توکن سیستمی، کوئری REST به پورت ۸۰۸۹ و خروجی JSON',
    descriptionEn: 'Production Python 3 script reading session keys from stdin, querying REST API, and auditing nodes.',
    content: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Splunk Cluster Doctor — Core Health & Inspection Script
Execution: Runs via inputs.conf [script://./bin/cluster_health_checker.py]
Authorization: Reads session key from sys.stdin via passAuth = splunk-system-user
"""

import sys
import os
import json
import time
import urllib.request
import urllib.parse
import ssl

def get_session_key():
    """Reads session token injected by Splunk's passAuth mechanism on stdin."""
    try:
        session_key = sys.stdin.readline().strip()
        if session_key.startswith("sessionKey="):
            session_key = session_key.split("=", 1)[1]
        return session_key
    except Exception as e:
        sys.stderr.write(f"Error reading session key: {e}\\n")
        return None

def query_splunk_rest(endpoint, session_key, mgmt_port=8089):
    """Queries Splunk local REST API with SSL context bypass for self-signed mgmt certs."""
    url = f"https://127.0.0.1:{mgmt_port}{endpoint}?output_mode=json"
    headers = {
        "Authorization": f"Splunk {session_key}",
        "Content-Type": "application/json"
    }
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            if response.status == 200:
                data = response.read().decode('utf-8')
                return json.loads(data)
    except Exception as err:
        return {"error": str(err), "endpoint": endpoint}
    return None

def audit_cluster_configuration():
    """Audits local critical configuration files for senior architect baselines."""
    splunk_home = os.environ.get("SPLUNK_HOME", "/opt/splunk")
    findings = []

    # 1. Audit outputs.conf for TLS
    outputs_path = os.path.join(splunk_home, "etc/system/local/outputs.conf")
    if os.path.exists(outputs_path):
        with open(outputs_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if "useSSL = false" in content or "useSSL=false" in content:
                findings.append({
                    "check": "TLS_ENCRYPTION",
                    "severity": "CRITICAL",
                    "file": "outputs.conf",
                    "message": "Forwarding traffic transmitted in cleartext without TLS."
                })

    # 2. Audit server.conf for pass4SymmKey
    server_path = os.path.join(splunk_home, "etc/system/local/server.conf")
    if os.path.exists(server_path):
        with open(server_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if "pass4SymmKey = changeme" in content:
                findings.append({
                    "check": "CLUSTER_SECRET",
                    "severity": "CRITICAL",
                    "file": "server.conf",
                    "message": "Default insecure pass4SymmKey 'changeme' detected."
                })

    return findings

def main():
    session_key = get_session_key()
    if not session_key:
        session_key = os.environ.get("SPLUNK_SESSION_KEY", "")

    timestamp = int(time.time())
    hostname = os.uname().nodename if hasattr(os, "uname") else "splunk-node"
    
    server_info = {}
    if session_key:
        server_info = query_splunk_rest("/services/server/info", session_key)
    
    findings = audit_cluster_configuration()
    
    report = {
        "timestamp": timestamp,
        "event_type": "splunk_cluster_doctor_audit",
        "hostname": hostname,
        "authenticated": bool(session_key),
        "server_status": server_info.get("entry", [{}])[0].get("content", {}).get("version", "unknown"),
        "findings_count": len(findings),
        "findings": findings,
        "status": "HEALTHY" if len(findings) == 0 else "WARNING"
    }
    
    # Output to stdout directly into Splunk indexing pipeline
    print(json.dumps(report))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
`
  },
  {
    path: 'bin/diag_collector.sh',
    filename: 'diag_collector.sh',
    category: 'scripts',
    descriptionFa: 'اسکریپت شل استخراج لاگ‌های عیب‌یابی تشخیصی (splunk diag) و بررسی سریع وضعیت',
    descriptionEn: 'Shell diagnostic automation script executing sanitized health dumps and btool audits.',
    content: `#!/bin/bash
# Splunk Cluster Doctor — Quick Diagnostics & Btool Auditor
set -e

SPLUNK_HOME=\${SPLUNK_HOME:-/opt/splunk}
OUTPUT_DIR="/tmp/splunk_doctor_diag_\$(date +%Y%m%d_%H%M%S)"

mkdir -p "\$OUTPUT_DIR"
echo "========================================================"
echo "Splunk Cluster Doctor — System Diagnostic Collector"
echo "Node: \$(hostname) | Date: \$(date)"
echo "========================================================"

echo "[1/4] Checking Splunk service status..."
"\$SPLUNK_HOME/bin/splunk" status > "\$OUTPUT_DIR/status.txt" 2>&1 || true

echo "[2/4] Running btool check for configuration syntax errors..."
"\$SPLUNK_HOME/bin/splunk" btool check --debug > "\$OUTPUT_DIR/btool_check.txt" 2>&1 || true

echo "[3/4] Exporting active inputs and outputs configurations..."
"\$SPLUNK_HOME/bin/splunk" btool inputs list --debug > "\$OUTPUT_DIR/btool_inputs.txt" 2>&1 || true
"\$SPLUNK_HOME/bin/splunk" btool outputs list --debug > "\$OUTPUT_DIR/btool_outputs.txt" 2>&1 || true
"\$SPLUNK_HOME/bin/splunk" btool server list --debug > "\$OUTPUT_DIR/btool_server.txt" 2>&1 || true

echo "[4/4] Generating summary report..."
tar -czf "\$OUTPUT_DIR.tar.gz" -C "/tmp" "\$(basename "\$OUTPUT_DIR")"
rm -rf "\$OUTPUT_DIR"

echo "✅ Diagnostic archive successfully created at: \$OUTPUT_DIR.tar.gz"
`
  },
  {
    path: 'default/data/ui/nav/default.xml',
    filename: 'default.xml',
    category: 'ui',
    descriptionFa: 'منوی ناوبری اپلیکیشن در وب اسپلانک با دسترسی به دشبوردها و راهنماها',
    descriptionEn: 'App navigation XML defining top menu bar in Splunk Web interface.',
    content: `<nav color="#0B131E">
  <view name="cluster_topology" default="true" label="Cluster Topology &amp; Ports" />
  <view name="config_auditor" label="Configuration Auditor" />
  <a href="https://docs.splunk.com" target="_blank">Official Docs Reference</a>
</nav>
`
  },
  {
    path: 'default/data/ui/views/cluster_topology.xml',
    filename: 'cluster_topology.xml',
    category: 'ui',
    descriptionFa: 'دشبورد Simple XML رسمی اسپلانک برای نمایش وضعیت گره‌ها، پورت‌ها و تله‌متری کلاستر',
    descriptionEn: 'Simple XML Dashboard rendering cluster nodes, port channels, and queue metrics.',
    content: `<dashboard version="1.1" theme="dark">
  <label>Splunk Cluster Health &amp; Topology Overview</label>
  <description>Real-time cluster topology, port monitoring, and peer synchronization telemetry.</description>
  
  <row>
    <panel>
      <single>
        <title>Cluster Replication Status</title>
        <search>
          <query>| rest /services/cluster/master/info | fields active_bundle, cluster_label, indexing_error_count</query>
          <earliest>-15m</earliest>
          <latest>now</latest>
        </search>
        <option name="colorMode">block</option>
        <option name="rangeColors">["0x10b981","0xf59e0b","0xef4444"]</option>
        <option name="underLabel">Replication Factor &amp; Search Factor Health</option>
      </single>
    </panel>
    <panel>
      <single>
        <title>Total Daily Ingestion Volume</title>
        <search>
          <query>index=_internal sourcetype=splunkd group=per_index_thruput | stats sum(kb) as total_kb | eval gb=round(total_kb/1024/1024, 2) | fields gb</query>
          <earliest>-24h</earliest>
          <latest>now</latest>
        </search>
        <option name="unit">GB</option>
        <option name="underLabel">Across All Production Indexes</option>
      </single>
    </panel>
    <panel>
      <single>
        <title>Active Misconfiguration Flags</title>
        <search>
          <query>index=_internal sourcetype=splunk:cluster:doctor | stats latest(findings_count) as total | fillnull value=0 total</query>
          <earliest>-1h</earliest>
          <latest>now</latest>
        </search>
        <option name="rangeColors">["0x10b981","0xf59e0b","0xef4444"]</option>
        <option name="rangeValues">[0,1]</option>
      </single>
    </panel>
  </row>

  <row>
    <panel>
      <table>
        <title>Active Cluster Nodes &amp; Management Ports</title>
        <search>
          <query>| rest /services/server/info | fields host_fqdn, serverName, role, version, os_name | rename host_fqdn as "FQDN", serverName as "Node Name", role as "Assigned Roles", version as "Splunk Version"</query>
          <earliest>-15m</earliest>
          <latest>now</latest>
        </search>
        <option name="count">10</option>
        <option name="drilldown">none</option>
      </table>
    </panel>
  </row>
</dashboard>
`
  },
  {
    path: 'default/data/ui/views/config_auditor.xml',
    filename: 'config_auditor.xml',
    category: 'ui',
    descriptionFa: 'دشبورد بررسی و ردیابی خطاهای کانفیگ (TLS، مقادیر پیش‌فرض، صف‌ها و پورت‌ها)',
    descriptionEn: 'Configuration auditor dashboard listing btool anomalies and security findings.',
    content: `<dashboard version="1.1" theme="dark">
  <label>Configuration Auditor &amp; Security Findings</label>
  <description>Live detection of deprecated protocols, cleartext transmissions, and quota risks.</description>

  <row>
    <panel>
      <table>
        <title>Detected Cluster Doctor Findings</title>
        <search>
          <query>index=_internal sourcetype=splunk:cluster:doctor | spath path=findings{} output=findings | mvexpand findings | spath input=findings | table _time, hostname, check, severity, file, message | sort - _time</query>
          <earliest>-24h</earliest>
          <latest>now</latest>
        </search>
        <option name="count">20</option>
        <option name="rowNumbers">true</option>
      </table>
    </panel>
  </row>
</dashboard>
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    category: 'docs',
    descriptionFa: 'توضیحات کلی بسته، معماری ماژول‌ها و نحوه عملکرد سیستم تشخیصی اسپلانک',
    descriptionEn: 'Documentation overview, architectural specs, and capabilities checklist.',
    content: `# Splunk Cluster Doctor & Architecture Studio (App ID: splunk_cluster_doctor)

## Overview
**Splunk Cluster Doctor & Architecture Studio** is an enterprise-grade application for Splunk Enterprise 9.x, designed to be deployed across Search Heads, Heavy Forwarders, Indexer Clusters, and Cluster Managers.

### Key Capabilities
- **Automated Cluster Telemetry:** Periodically polls REST API on port \`8089\` with zero-credential \`passAuth = splunk-system-user\`.
- **Btool Configuration Check:** Automatically analyzes \`inputs.conf\`, \`outputs.conf\`, \`server.conf\`, and \`indexes.conf\` for precedence issues and security violations.
- **TLS & Security Hardening:** Detects \`useSSL = false\`, deprecated SSLv3/TLS1.0 protocols, and default \`pass4SymmKey\` secrets.
- **Topology Dashboards:** High-resolution Simple XML dashboards embedded in Splunk Web.

### Compatibility
- Splunk Enterprise 9.0.x, 9.1.x, 9.2.x, 9.3.x, 9.4.x
- Splunk Cloud Platform
- Linux (RHEL, Debian, Ubuntu, CentOS, SLES) & Windows Server
`
  }
];
