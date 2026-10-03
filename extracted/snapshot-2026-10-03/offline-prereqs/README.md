# Offline RHEL prerequisite media

This directory is populated during the release build with all user-space RPM dependencies required by Splunk Cluster Doctor on RHEL-compatible 8 and 9 x86_64 systems.

The release pipeline stages:
- networking and socket tools such as iproute, iputils, nmap-ncat and lsof;
- shell/file tools such as coreutils, findutils, gawk, sed, grep, tar, gzip and util-linux;
- security/SELinux tooling such as openssl, policycoreutils and policycoreutils-python-utils;
- remote/admin tooling such as openssh-clients, rsync and curl;
- firewall tooling such as firewalld and iptables;
- Python 3;
- Podman and all resolved RPM dependencies needed by the real container operations;
- a verified kubectl v1.37.1 x86_64 binary.

The runtime installer uses DNF with --disablerepo='*', so it installs only from this media.

The RHEL kernel and systemd remain host OS components. Splunk Enterprise itself is operator-supplied because its licensed distribution is not redistributed by this project.
