Pilot offline-cache
==================

The standalone package optionally bundles this directory as:
  /opt/splunk-doctor/offline-cache/

Populate the subdirectories below before packaging when fully air-gapped deployment is required:

  node/
    Node.js runtime payload used for local/offline builds.

  npm-cache/
    Prebuilt Node dependency archive used by CI/local packaging.

  kubectl/v1.37.1/linux-amd64/
    kubectl and its SHA256 file.

  rhel8/x86_64/
    RPMs + repodata + kubectl for RHEL/Rocky 8.

  rhel9/x86_64/
    RPMs + repodata + kubectl for RHEL/Rocky 9.

  rocky/
    Docker/Podman image archives for rockylinux:8 and rockylinux:9.
    Expected filenames:
      rockylinux-8.tar.gz
      rockylinux-9.tar.gz

  splunk/
    Splunk Enterprise Docker image archives, for example:
      splunk-<tag>.tar.gz

The packager copies the whole offline-cache directory into the final standalone
package when this directory is present. install-all-offline.sh automatically
loads .tar/.tar.gz/.tgz container images from rocky/ and splunk/ when Docker or
Podman is available.

Do not commit secrets or runtime state here.