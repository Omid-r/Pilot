# Offline package contract

The release bundle is intended to be installable without external repositories or language-package downloads.

The installer must ship:
- the bundled Linux x86_64 Node.js runtime;
- the production application and runtime node_modules;
- RHEL 8 and RHEL 9 x86_64 RPM dependency sets for the user-space commands used by the real control plane;
- a verified kubectl binary;
- the real offline installer that installs only from the shipped media.

The host must still be a supported RHEL-compatible system with a native RPM database, DNF, kernel, and systemd. Splunk Enterprise itself is operator-supplied because its licensed distribution is not redistributed by this project.
