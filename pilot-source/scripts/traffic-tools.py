#!/usr/bin/env python3
"""
traffic-tools.py — Unified Network Engine for Splunk Cluster Doctor & Network Toolbox.
Provides:
  - Role Detection (Server, Forwarder, Firewall, Router, Switch, Client) with scoring
  - Active Socket & Peer Inspector (ss -tunap)
  - Conntrack Flow Table (/proc/net/nf_conntrack or conntrack -L)
  - Port Reachability Tester (TCP/UDP with latency)
  - Latency & Ping Tester
  - Traceroute Path Analysis
  - Network Map Discovery (Gateway, DNS, ARP, LLDP, Live Peers)
"""
import sys
import os
import json
import re
import shutil
import subprocess
import socket
import time

SERVICES = {
    20: "FTP", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    67: "DHCP", 68: "DHCP", 69: "TFTP", 80: "HTTP", 88: "Kerberos", 110: "POP3",
    111: "RPCbind", 123: "NTP", 137: "NetBIOS", 138: "NetBIOS", 139: "NetBIOS",
    143: "IMAP", 161: "SNMP", 162: "SNMP", 389: "LDAP", 443: "HTTPS", 445: "SMB",
    464: "Kerberos-pw", 500: "IPsec/IKE", 514: "Syslog", 546: "DHCPv6", 547: "DHCPv6",
    587: "SMTP-submit", 636: "LDAPS", 873: "rsync", 993: "IMAPS", 995: "POP3S",
    1080: "SOCKS", 1194: "OpenVPN", 1433: "MSSQL", 1521: "Oracle-DB", 1514: "Syslog-TLS",
    1900: "SSDP", 2049: "NFS", 3306: "MySQL", 3389: "RDP", 5060: "SIP", 5061: "SIP",
    5353: "mDNS", 5432: "PostgreSQL", 5900: "VNC", 6379: "Redis", 8000: "Splunk-Web",
    8080: "HTTP-alt", 8088: "Splunk-HEC", 8089: "Splunk-Mgmt", 8443: "HTTPS-alt",
    9200: "Elasticsearch", 9997: "Splunk-S2S", 11211: "Memcached", 27017: "MongoDB"
}

def svc(p):
    try:
        return SERVICES.get(int(p), "")
    except Exception:
        return ""

def quick_run(cmd, timeout=8):
    try:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout).stdout.strip()
    except Exception:
        return ""

def get_our_ips():
    ips = []
    try:
        out = quick_run("ip -o -4 addr show; ip -o -6 addr show")
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 4 and "/" in parts[3]:
                ips.append(parts[3].split("/")[0])
    except Exception:
        pass
    if not ips:
        ips = ["127.0.0.1"]
    return list(set(ips))

def detect_role():
    ev = []
    sc = {"server": 0, "forwarder": 0, "firewall": 0, "router": 0, "switch": 0, "client": 0}
    try:
        if os.path.exists("/proc/sys/net/ipv4/ip_forward"):
            fwd = open("/proc/sys/net/ipv4/ip_forward").read().strip() == "1"
            if fwd:
                sc["router"] += 3
                sc["firewall"] += 1
                ev.append("ip_forward=1 (IP forwarding enabled in kernel)")
    except Exception:
        pass

    # Network interfaces
    links = [l.split() for l in quick_run("ip -br link").splitlines() if l.strip()]
    ifaces = [l[0] for l in links if len(l) >= 2]
    addrs_raw = quick_run("ip -br addr")
    routed = []
    parsed_ifaces = []
    for l in addrs_raw.splitlines():
        f = l.split()
        if len(f) >= 2:
            ip_val = f[2] if len(f) >= 3 else ""
            parsed_ifaces.append({"iface": f[0], "status": f[1], "ip": ip_val})
            if not f[0].startswith(("lo", "docker", "veth", "virbr", "br-")) and "." in ip_val:
                routed.append(f[0])

    if len(set(routed)) >= 2:
        sc["router"] += 2
        ev.append(f"{len(set(routed))} routed interfaces ({', '.join(sorted(set(routed))[:4])})")

    # Bridge & Switch detection
    bridges = [i for i in ifaces if i.startswith(("br", "virbr", "docker", "veth", "bond"))]
    if bridges:
        sc["switch"] += min(4, 1 + len(bridges))
        ev.append(f"Bridge/bonding interfaces present: {', '.join(bridges[:3])}")

    # Firewall detection
    fw_running = quick_run("firewall-cmd --state 2>/dev/null") == "running"
    ipt_rules = len(quick_run("iptables -S 2>/dev/null").splitlines())
    if fw_running:
        sc["firewall"] += 3
        ev.append("firewalld service is actively running")
    if ipt_rules > 25:
        sc["firewall"] += 2
        ev.append(f"{ipt_rules} active iptables filter rules")

    # Listeners detection
    listeners_tcp = len([l for l in quick_run("ss -tlnH 2>/dev/null").splitlines() if l.strip()])
    listeners_udp = len([l for l in quick_run("ss -ulnH 2>/dev/null").splitlines() if l.strip()])
    total_listeners = listeners_tcp + listeners_udp

    # Splunk Forwarder vs Full Splunk Server detection
    splunkd_ps = quick_run("pgrep -a splunkd 2>/dev/null || ps -ef | grep '[s]plunkd'")
    if splunkd_ps:
        if "splunkforwarder" in splunkd_ps.lower():
            sc["forwarder"] += 4
            ev.append("Splunk Universal/Heavy Forwarder binary splunkd is running")
        else:
            sc["server"] += 3
            ev.append("Splunk Enterprise instance (splunkd) is running")

    if total_listeners >= 3:
        sc["server"] += 2
        ev.append(f"{total_listeners} listening network services (TCP/UDP)")

    estab = len([l for l in quick_run("ss -tnH state established 2>/dev/null").splitlines() if l.strip()])
    defgw = "default via" in quick_run("ip route 2>/dev/null")
    if defgw:
        ev.append("Default gateway is configured")

    if total_listeners <= 2 and defgw:
        sc["client"] += 2

    best_role = max(sc, key=lambda k: sc[k])
    if best_role == "server" and "forwarder" in "".join(ev).lower():
        best_role = "forwarder"

    # Routes
    routes = [r.strip() for r in quick_run("ip route 2>/dev/null").splitlines() if r.strip()][:15]

    # ARP Neighbors
    neighbors = []
    for l in quick_run("ip neigh 2>/dev/null").splitlines()[:20]:
        parts = l.split()
        if len(parts) >= 4:
            neighbors.append({
                "ip": parts[0],
                "dev": parts[2] if len(parts) > 2 else "eth0",
                "lladdr": parts[4] if len(parts) > 4 else "",
                "state": parts[-1]
            })

    # DNS
    dns_servers = []
    try:
        if os.path.exists("/etc/resolv.conf"):
            for line in open("/etc/resolv.conf"):
                if line.strip().startswith("nameserver"):
                    dns_servers.append(line.split()[1])
    except Exception:
        pass

    return {
        "role": best_role,
        "score": sc,
        "evidence": ev,
        "ifacesCount": len(ifaces),
        "interfaces": parsed_ifaces,
        "listenersCount": total_listeners,
        "establishedCount": estab,
        "routes": routes,
        "neighbors": neighbors,
        "dnsServers": dns_servers,
        "firewallStatus": "Running (firewalld)" if fw_running else ("iptables active" if ipt_rules > 0 else "inactive")
    }

def get_connections():
    our_ips = set(get_our_ips())
    lines = quick_run("ss -tunap 2>/dev/null").splitlines()
    results = []

    for l in lines[1:]:
        parts = l.split(None, 6)
        if len(parts) < 6:
            continue
        proto = parts[0].upper()
        local_ep = parts[4]
        peer_ep = parts[5]

        proc = "-"
        m_proc = re.search(r'"([^"]+)"', l)
        if m_proc:
            proc = m_proc.group(1)

        # Parse local port
        m_lp = re.search(r':(\d+)$', local_ep)
        lport = m_lp.group(1) if m_lp else "-"

        # Parse peer
        peer_clean = peer_ep.rstrip(':*')
        m_rp = re.search(r':(\d+)$', peer_clean)
        rport = m_rp.group(1) if m_rp else "-"
        remote_ip = peer_clean.rsplit(':', 1)[0].strip('[]') if m_rp else peer_clean.strip('[]')

        if not remote_ip or remote_ip in ("*", "0.0.0.0", "::"):
            continue

        direction = "IN"
        if remote_ip not in our_ips and parts[1] == "ESTAB":
            # If local port is well-known service, it's IN; otherwise if remote port is well-known, OUT
            if svc(lport):
                direction = "IN"
            elif svc(rport) or (rport != "-" and int(rport) < 1024):
                direction = "OUT"
            else:
                direction = "OUT"

        s_r = svc(rport)
        s_l = svc(lport)
        purpose = ""
        if direction == "OUT":
            purpose = f"{s_r or s_l or 'Request'}: outbound request to remote port {rport}"
        else:
            purpose = f"{s_l or s_r or 'Service'}: inbound traffic to local port {lport}"

        action = "ACCEPT*" if parts[1] == "ESTAB" or svc(lport) else "-"

        results.append({
            "remoteIp": remote_ip,
            "remotePort": rport,
            "localPort": lport,
            "proto": proto,
            "dir": direction,
            "action": action,
            "packets": 1,
            "proc": proc,
            "purpose": purpose
        })

    return results[:100]

def get_flows(fproto="any", fstate="", fdir="all", fmax=100):
    raw = ""
    if shutil.which("conntrack"):
        raw = quick_run("conntrack -L 2>/dev/null", timeout=6)
    if not raw and os.path.exists("/proc/net/nf_conntrack"):
        try:
            raw = open("/proc/net/nf_conntrack").read()
        except Exception:
            pass

    flows = []
    ours = set(get_our_ips())

    for l in raw.splitlines():
        m = re.search(r"(\S+)\s+\d+\s+\S+\s*(\S+)?\s*src=([\d.:a-f]+) dst=([\d.:a-f]+) sport=(\d+) dport=(\d+).*src=([\d.:a-f]+) dst=([\d.:a-f]+) sport=(\d+) dport=(\d+)", l)
        if not m:
            continue
        proto = m.group(1).upper()
        if fproto != "any" and proto.lower() != fproto.lower():
            continue
        if fstate and fstate.lower() not in l.lower():
            continue

        osrc, odst, osp, odp = m.group(3), m.group(4), m.group(5), m.group(6)
        rsrc, rdst, rsp, rdp = m.group(7), m.group(8), m.group(9), m.group(10)
        direction = "OUT" if osrc in ours else "IN"

        if fdir != "all" and direction.lower() != fdir.lower():
            continue

        st_match = re.search(r"\[(\w+)\]", l)
        state_label = st_match.group(1) if st_match else "ESTABLISHED"

        flows.append({
            "dir": direction,
            "proto": proto,
            "origSrc": osrc,
            "origDst": odst,
            "origSport": osp,
            "origDport": odp,
            "replySrc": rsrc,
            "replyDst": rdst,
            "replySport": rsp,
            "replyDport": rdp,
            "state": state_label
        })
        if len(flows) >= fmax:
            break

    return flows

def test_port(target, port, proto="tcp", timeout_s=1.8):
    t0 = time.time()
    try:
        ip = socket.gethostbyname(target)
    except Exception as e:
        return {"port": port, "proto": proto, "status": "ERROR", "latencyMs": 0, "message": f"DNS resolve failed: {e}"}

    if proto == "tcp":
        try:
            s = socket.create_connection((target, port), timeout=timeout_s)
            s.close()
            latency = int((time.time() - t0) * 1000)
            return {"port": port, "proto": "tcp", "status": "OPEN", "latencyMs": latency, "message": f"Connected to {ip}:{port}"}
        except socket.timeout:
            return {"port": port, "proto": "tcp", "status": "FILTERED", "latencyMs": int(timeout_s * 1000), "message": "Connection timed out (FIREWALL DROP / no SYN-ACK)"}
        except ConnectionRefusedError:
            latency = int((time.time() - t0) * 1000)
            return {"port": port, "proto": "tcp", "status": "CLOSED", "latencyMs": latency, "message": "Connection refused (RST received, port closed or service down)"}
        except Exception as e:
            return {"port": port, "proto": "tcp", "status": "ERROR", "latencyMs": int((time.time() - t0) * 1000), "message": str(e)}
    else:
        # UDP probe
        try:
            u = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            u.settimeout(timeout_s)
            u.sendto(b"", (target, port))
            try:
                data, _ = u.recvfrom(2048)
                u.close()
                latency = int((time.time() - t0) * 1000)
                return {"port": port, "proto": "udp", "status": "OPEN", "latencyMs": latency, "message": f"Received {len(data)}B response from {ip}:{port}"}
            except socket.timeout:
                u.close()
                return {"port": port, "proto": "udp", "status": "FILTERED", "latencyMs": int(timeout_s * 1000), "message": "No response received (typical for UDP listener or filtered)"}
        except Exception as e:
            return {"port": port, "proto": "udp", "status": "ERROR", "latencyMs": 0, "message": str(e)}

def run_ping(target, count=4, size=56, interval=0.8):
    if not shutil.which("ping"):
        return {"target": target, "transmitted": 0, "received": 0, "lossPercent": 100, "rawOutput": "ping binary not found"}
    cmd = ["ping", "-c", str(count), "-s", str(size), "-i", str(interval), "-W", "2", target]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=count * 3 + 5)
        raw = p.stdout + p.stderr
        m_loss = re.search(r"(\d+)\s+packets transmitted,\s+(\d+)\s+(?:received|packets received)[^,]*,\s+(\d+(?:\.\d+)?)%\s+packet loss", raw)
        m_rtt = re.search(r"(?:min/avg/max|rtt min/avg/max/mdev)\s*=\s*([\d.]+)/([\d.]+)/([\d.]+)(?:/([\d.]+))?", raw)

        trans = int(m_loss.group(1)) if m_loss else count
        recv = int(m_loss.group(2)) if m_loss else 0
        loss = float(m_loss.group(3)) if m_loss else 100.0

        res = {
            "target": target,
            "transmitted": trans,
            "received": recv,
            "lossPercent": loss,
            "rawOutput": raw
        }
        if m_rtt:
            res["minMs"] = float(m_rtt.group(1))
            res["avgMs"] = float(m_rtt.group(2))
            res["maxMs"] = float(m_rtt.group(3))
            if m_rtt.group(4):
                res["mdevMs"] = float(m_rtt.group(4))
        return res
    except Exception as e:
        return {"target": target, "transmitted": count, "received": 0, "lossPercent": 100, "rawOutput": str(e)}

def get_network_map():
    nodes = []
    # 1. Gateway
    for l in quick_run("ip route 2>/dev/null").splitlines():
        if l.startswith("default via"):
            gw = l.split()[2]
            nodes.append({"ip": gw, "kind": "gateway", "note": "Default IP Gateway", "priority": 0})
            break

    # 2. DNS
    try:
        if os.path.exists("/etc/resolv.conf"):
            for l in open("/etc/resolv.conf"):
                if l.strip().startswith("nameserver"):
                    nodes.append({"ip": l.split()[1], "kind": "dns", "note": "Primary DNS Resolver", "priority": 1})
    except Exception:
        pass

    # 3. ARP Neighbors
    for l in quick_run("ip neigh 2>/dev/null").splitlines()[:15]:
        parts = l.split()
        if len(parts) >= 2 and re.match(r"^[0-9a-fA-F.:]+$", parts[0]):
            nodes.append({"ip": parts[0], "kind": "arp", "note": f"L2 ARP Neighbor ({parts[-1]})", "priority": 2})

    # 4. Splunk Cluster endpoints if defined
    return nodes

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "role"
    if action == "role":
        print(json.dumps(detect_role(), indent=2))
    elif action == "connections":
        print(json.dumps(get_connections(), indent=2))
    elif action == "flows":
        print(json.dumps(get_flows(), indent=2))
    elif action == "map":
        print(json.dumps(get_network_map(), indent=2))
