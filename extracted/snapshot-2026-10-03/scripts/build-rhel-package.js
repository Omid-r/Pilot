import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const PACKAGE_VERSION = '1.5.0';
const BUILD_DATE = new Date().toISOString();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = fs.existsSync(path.resolve(__dirname, '../package.json')) 
  ? path.resolve(__dirname, '..') 
  : (fs.existsSync('/opt/splunk-doctor/package.json') ? '/opt/splunk-doctor' : process.cwd());

console.log(`[RHEL Packager] Building Splunk Cluster Doctor Standalone RHEL Package v${PACKAGE_VERSION}...`);
console.log(`[RHEL Packager] App Root Directory: ${rootDir}`);
const stagingDir = path.join('/tmp', 'splunk_doctor_rhel_staging');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Ensure production build exists
const distIndex = path.join(rootDir, 'dist/index.html');
const distServer = path.join(rootDir, 'dist/server.cjs');
if (!fs.existsSync(distIndex) || !fs.existsSync(distServer)) {
  throw new Error('[RHEL Packager] dist/index.html and dist/server.cjs must exist before packaging. Run npm run build first.');
}

// 2. Clean staging
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 2b. Bundle the exact Linux Node runtime used to build this release.
const nodeRuntimeDir = path.join(stagingDir, 'node-runtime', 'bin');
fs.mkdirSync(nodeRuntimeDir, { recursive: true });
fs.copyFileSync(process.execPath, path.join(nodeRuntimeDir, 'node'));
fs.chmodSync(path.join(nodeRuntimeDir, 'node'), 0o755);

// 3. Copy compiled dist/ (excluding nested archives to keep package lightweight and fast)
const distDir = path.join(rootDir, 'dist');
const distTarget = path.join(stagingDir, 'dist');
fs.mkdirSync(distTarget, { recursive: true });

if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
  execSync(`cp -r "${distDir}"/* "${distTarget}/" 2>/dev/null || true`);
} else {
  throw new Error('[RHEL Packager] dist/ is empty; refusing to package a placeholder application.');
}
// Remove any nested tarballs from distTarget
try {
  execSync(`rm -f "${distTarget}"/*.tar.gz "${distTarget}"/*.spl`);
} catch (e) {}

// 3b. Copy network toolbox & fix scripts
const scriptsTarget = path.join(stagingDir, 'scripts');
fs.mkdirSync(scriptsTarget, { recursive: true });
if (fs.existsSync(path.join(rootDir, 'scripts'))) {
  execSync(`cp -r "${path.join(rootDir, 'scripts')}/"* "${scriptsTarget}/"`);
  // Also copy key fixers and tools directly to root of staging with executable bit
  ['fix.sh', 'indexer-fix.sh', 'peer-traffic.sh', 'install-traffic-tools.sh', 'deploy-splunk-k8s-offline.sh', 'fix-parallel-web.sh', 'install-offline-docker-k8s.sh', 'install-container-engine-offline.sh', 'install-all-offline.sh', 'reset-splunk-password.sh', 'setup.sh', 'reinstall-and-run.sh', 'uninstall.sh'].forEach(s => {
    const src = path.join(rootDir, 'scripts', s);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(stagingDir, s));
      try { fs.chmodSync(path.join(stagingDir, s), 0o755); } catch (e) {}
    }
  });
  // Restore executable permissions for every bundled installer/diagnostic script.
  try {
    execSync(`find "${scriptsTarget}" -type f \\( -name '*.sh' -o -name '*.bash' -o -name '*.py' -o -name '*.pl' -o -name '*.rb' \\) -exec chmod 755 {} + 2>/dev/null || true`);
  } catch (_) {}
  try {
    execSync(`chmod +x "${scriptsTarget}"/*.sh "${scriptsTarget}"/*.py 2>/dev/null || true`);
  } catch (_) {}
}

// Remove runtime-generated secrets/state from the package staging tree.
for (const secret of ['data/security-db.json', 'data/master-signing.key', 'data/bootstrap-admin-password']) {
  const secretPath = path.join(stagingDir, secret);
  if (fs.existsSync(secretPath)) fs.rmSync(secretPath, { force: true });
}

// 4. Create package.json for standalone RHEL server
const rhelPackageJson = {
  name: "splunk-cluster-doctor-rhel",
  version: PACKAGE_VERSION,
  private: true,
  description: "Standalone Splunk Cluster Doctor & Architecture Studio for RHEL / CentOS / Rocky Linux",
  main: "dist/server.cjs",
  scripts: {
    start: "node dist/server.cjs",
    service: "bash ./install-service.sh"
  },
  dependencies: {
    express: "^4.21.2"
  }
};
fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(rhelPackageJson, null, 2), 'utf8');

// 5. Create start.sh (executable runner for RHEL)
const startSh = `#!/usr/bin/env bash
# ==============================================================================
# Splunk Cluster Doctor & Architecture Studio - RHEL Standalone Launcher
# Version: ${PACKAGE_VERSION}
# ==============================================================================

set -e

DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo " Starting Splunk Cluster Doctor (RHEL Standalone v${PACKAGE_VERSION})"
echo "=========================================================="

# Install the bundled runtime into /usr/local/bin so standard RHEL SELinux policy permits execution.
if [ -x "$DIR/node-runtime/bin/node" ]; then
    install -d -m 0755 /usr/local/bin
    install -m 0755 "$DIR/node-runtime/bin/node" /usr/local/bin/splunk-doctor-node
    if command -v semanage >/dev/null 2>&1; then
      semanage fcontext -a -t bin_t /usr/local/bin/splunk-doctor-node 2>/dev/null || semanage fcontext -m -t bin_t /usr/local/bin/splunk-doctor-node 2>/dev/null || true
    fi
    if command -v restorecon >/dev/null 2>&1; then restorecon -v /usr/local/bin/splunk-doctor-node || true; fi
    NODE_BIN="/usr/local/bin/splunk-doctor-node"
else
    NODE_BIN="$(command -v node 2>/dev/null || true)"
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
    echo "[-] No usable Node.js runtime found."
    exit 1
fi
NODE_VER=$("$NODE_BIN" -v)
echo "[+] Detected Node.js: $NODE_VER ($NODE_BIN)"

# Auto-detect Splunk Home if not set
if [ -z "$SPLUNK_HOME" ]; then
    if [ -d "/opt/splunk" ]; then
        export SPLUNK_HOME="/opt/splunk"
    elif [ -d "/opt/splunkforwarder" ]; then
        export SPLUNK_HOME="/opt/splunkforwarder"
    elif command -v splunk >/dev/null 2>&1; then
        export SPLUNK_HOME="$(dirname "$(dirname "$(readlink -f "$(which splunk)")")")"
    else
        export SPLUNK_HOME="/opt/splunk"
    fi
fi

# Check execution user and permissions
CURRENT_USER="$(whoami)"
CURRENT_UID="$(id -u 2>/dev/null || echo 1000)"
echo "[+] Running as user: $CURRENT_USER (UID: $CURRENT_UID)"
if [ "$CURRENT_UID" -ne 0 ] && [ "$CURRENT_USER" != "splunk" ]; then
    echo "----------------------------------------------------------"
    echo "[!] NOTICE: You are running as non-root user '$CURRENT_USER'."
    echo "[!] To allow Splunk Cluster Doctor to inspect real listening ports (ss -tulpn) and read protected .conf files:"
    echo "[!] Recommend running with: sudo ./start.sh"
    echo "[!] Or install as permanent systemd service: sudo bash install-service.sh"
    echo "----------------------------------------------------------"
fi

# Export Environment
export NODE_ENV=production
export PORT=\${PORT:-3000}

echo "[+] Application Port: $PORT"
echo "[+] Target Splunk Home: $SPLUNK_HOME"
echo "----------------------------------------------------------"
echo " Access UI in your browser at: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):$PORT"
echo " Press Ctrl+C to stop."
echo "=========================================================="

exec "$NODE_BIN" dist/server.cjs
`;
fs.writeFileSync(path.join(stagingDir, 'start.sh'), startSh, { encoding: 'utf8', mode: 0o755 });

// 6. Create systemd unit file
const systemdDir = path.join(stagingDir, 'systemd');
fs.mkdirSync(systemdDir, { recursive: true });
const serviceFile = `[Unit]
Description=Splunk Cluster Doctor & Architecture Studio
Documentation=https://github.com/splunk/splunk-cluster-doctor
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/splunk-doctor
ExecStart=/usr/local/bin/splunk-doctor-node /opt/splunk-doctor/dist/server.cjs
UMask=0077
Restart=always
RestartSec=5
KillMode=process
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SPLUNK_HOME=/opt/splunk
Environment=SPLUNK_DOCTOR_DATA_DIR=/var/lib/splunk-doctor
UMask=0077

# Security limits
LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
`;
fs.writeFileSync(path.join(systemdDir, 'splunk-doctor.service'), serviceFile, 'utf8');

// 7. Create install-service.sh
const installScript = `#!/usr/bin/env bash
# ==============================================================================
# Automated Systemd Installer for RHEL / CentOS / Rocky Linux / AlmaLinux
# ==============================================================================
set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root: sudo bash install-service.sh"
  exit 1
fi

TARGET_DIR="/opt/splunk-doctor"
echo "[+] Installing Splunk Cluster Doctor to $TARGET_DIR..."

mkdir -p "$TARGET_DIR"
cp -r ./* "$TARGET_DIR/"
find "$TARGET_DIR" -type d -exec chmod 755 {} +
find "$TARGET_DIR" -type f -exec chmod 644 {} +
find "$TARGET_DIR" -type f \( -name '*.sh' -o -name '*.bash' -o -name '*.py' -o -name '*.pl' -o -name '*.rb' \) -exec chmod 755 {} +
for executable in "$TARGET_DIR/node-runtime/bin/node" "$TARGET_DIR/kubectl" "$TARGET_DIR/k3s" "$TARGET_DIR/bin/kubectl"; do
  [ -f "$executable" ] && chmod 755 "$executable" 2>/dev/null || true
done
chmod +x "$TARGET_DIR"/*.sh "$TARGET_DIR"/scripts/*.sh 2>/dev/null || true
mkdir -p /var/lib/splunk-doctor
chmod 700 /var/lib/splunk-doctor
if command -v restorecon >/dev/null 2>&1; then
  restorecon -RF "$TARGET_DIR" /var/lib/splunk-doctor || true
fi

# Dynamic Node.js path discovery
NODE_PATH="$(command -v node 2>/dev/null || echo "/usr/bin/node")"
sed -i "s|ExecStart=.*|ExecStart=\${NODE_PATH} /opt/splunk-doctor/dist/server.cjs|g" "$TARGET_DIR/systemd/splunk-doctor.service" 2>/dev/null || true

echo "[+] Installing systemd service: /etc/systemd/system/splunk-doctor.service"
cp "$TARGET_DIR/systemd/splunk-doctor.service" /etc/systemd/system/splunk-doctor.service

systemctl daemon-reload
systemctl enable splunk-doctor.service
systemctl restart splunk-doctor.service

# Open firewall port if firewalld is active
if systemctl is-active --quiet firewalld; then
  echo "[+] Configuring firewalld for ports 3000, 8001, 8090, 9998/tcp..."
  firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
  firewall-cmd --permanent --add-port=8001/tcp 2>/dev/null || true
  firewall-cmd --permanent --add-port=8090/tcp 2>/dev/null || true
  firewall-cmd --permanent --add-port=9998/tcp 2>/dev/null || true
  firewall-cmd --permanent --add-port=8193/tcp 2>/dev/null || true
  firewall-cmd --reload || true
fi

echo ""
echo "===================================================================="
echo " [SUCCESS] Splunk Cluster Doctor is installed and running!"
echo " Status:   systemctl status splunk-doctor"
echo " Logs:     journalctl -u splunk-doctor -f"
echo " Web UI:   http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER_IP'):3000"
echo "===================================================================="
`;
fs.writeFileSync(path.join(stagingDir, 'install-service.sh'), installScript, { encoding: 'utf8', mode: 0o755 });

// 7b. Create setup.sh (MASTER ALL-IN-ONE: Uninstall, Fix Permissions, Install, Firewall, Start & Verify)
const setupScript = `#!/usr/bin/env bash
# ==============================================================================
# setup.sh — MASTER ALL-IN-ONE DEPLOYER & SELF-HEALER
# نسخه نصب و راه‌اندازی ۱۰۰٪ خودکار بدون نیاز به حذف دستی و تغییر مجوزها
# ==============================================================================

set -e

SOURCE_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TARGET_DIR="/opt/splunk-doctor"

echo "======================================================================"
echo "  🚀 [SPLUNK CLUSTER DOCTOR] ALL-IN-ONE AUTOMATED DEPLOYER"
echo "  اسکریپت جامع خودکار: حذف نسخه قبلی + تنظیم دسترسی‌ها + نصب و راه‌اندازی"
echo "======================================================================"

# 1. Root privilege check
if [ "$EUID" -ne 0 ]; then
  echo "[-] خطا: این اسکریپت برای مدیریت سرویس و فایروال به دسترسی root نیاز دارد."
  echo "[!] لطفاً دستور زیر را اجرا کنید: sudo bash setup.sh"
  exit 1
fi

# 2. Stop and uninstall any previous running service or orphaned node process
echo "==> [۱/۶] متوقف‌سازی و پاکسازی کامل نسخه‌های قبلی (Clean Uninstall)..."
if systemctl is-active --quiet splunk-doctor 2>/dev/null; then
  echo "  -> در حال توقف سرویس قبلی splunk-doctor..."
  systemctl stop splunk-doctor 2>/dev/null || true
fi

if systemctl is-enabled --quiet splunk-doctor 2>/dev/null; then
  systemctl disable splunk-doctor 2>/dev/null || true
fi

# Kill any stale node or orphaned process holding port 3000
fuser -k 3000/tcp 2>/dev/null || true

# 3. Clean target directory while preserving backups if needed
echo "==> [۲/۶] آماده‌سازی دایرکتوری هدف (\${TARGET_DIR})..."
mkdir -p "\${TARGET_DIR}"
rm -rf "\${TARGET_DIR}/dist" "\${TARGET_DIR}/scripts" "\${TARGET_DIR}/systemd" 2>/dev/null || true

# 4. Copy current package files
echo "==> [۳/۶] کپی و استقرار فایل‌های بسته جدید..."
cp -rf "\${SOURCE_DIR}"/* "\${TARGET_DIR}/"

# Normalize installation permissions and restore executable bits only on
# installers, diagnostic scripts and bundled runtime binaries.
echo "==> [۴/۶] اعمال و تثبیت مجوزهای نصب و فایل‌های اجرایی..."
find "\${TARGET_DIR}" -type d -exec chmod 755 {} +
find "\${TARGET_DIR}" -type f -exec chmod 644 {} +
find "${TARGET_DIR}" -type f \( -name '*.sh' -o -name '*.bash' -o -name '*.py' -o -name '*.pl' -o -name '*.rb' \) -exec chmod 755 {} +
for executable in \
  "\${TARGET_DIR}/node-runtime/bin/node" \
  "\${TARGET_DIR}/kubectl" \
  "\${TARGET_DIR}/k3s" \
  "\${TARGET_DIR}/bin/kubectl"; do
  [ -f "\${executable}" ] && chmod 755 "\${executable}" 2>/dev/null || true
done
chmod +x "\${TARGET_DIR}"/*.sh "\${TARGET_DIR}"/scripts/*.sh 2>/dev/null || true

# Check / find Node.js binary path
NODE_BIN="$(command -v node 2>/dev/null || which node 2>/dev/null || echo "")"
if [ -z "\$NODE_BIN" ]; then
  if [ -f "/usr/bin/node" ]; then NODE_BIN="/usr/bin/node";
  elif [ -f "/usr/local/bin/node" ]; then NODE_BIN="/usr/local/bin/node";
  elif [ -f "/opt/rh/rh-nodejs18/root/usr/bin/node" ]; then NODE_BIN="/opt/rh/rh-nodejs18/root/usr/bin/node";
  elif [ -f "/opt/rh/rh-nodejs16/root/usr/bin/node" ]; then NODE_BIN="/opt/rh/rh-nodejs16/root/usr/bin/node";
  elif [ -f "/opt/splunk/bin/node" ]; then NODE_BIN="/opt/splunk/bin/node";
  fi
fi

if [ -z "\$NODE_BIN" ]; then
  echo "[-] اخطار: نود جی‌اس (Node.js) یافت نشد."
  echo "[!] لطفاً با یکی از دستورات زیر Node.js را نصب کنید و مجدداً setup.sh را اجرا نمایید:"
  echo "    sudo dnf install -y nodejs   (RHEL 8 / RHEL 9 / Rocky Linux)"
  echo "    sudo yum install -y nodejs   (RHEL 7 / CentOS 7)"
  exit 1
fi
echo "  -> مسیر شناسایی‌شده Node.js: \$NODE_BIN"

# 6. Configure Systemd Service dynamically
echo "==> [۵/۶] پیکربندی و فعال‌سازی سرویس دائمی Systemd (splunk-doctor.service)..."
cat << EOF > /etc/systemd/system/splunk-doctor.service
[Unit]
Description=Splunk Cluster Doctor & Architecture Studio
Documentation=https://github.com/splunk/splunk-cluster-doctor
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=\${TARGET_DIR}
ExecStart=\${NODE_BIN} \${TARGET_DIR}/dist/server.cjs
Restart=always
RestartSec=3
KillMode=process
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SPLUNK_HOME=/opt/splunk

LimitNOFILE=65536
LimitNPROC=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable splunk-doctor.service
systemctl restart splunk-doctor.service

# 7. Configure Firewall rules
echo "==> [۶/۶] تنظیم قوانین فایروال لینوکس برای پورت ۳۰۰۰ و پورت‌های موازی..."
if systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --zone=public --add-port=3000/tcp 2>/dev/null || true
  firewall-cmd --permanent --zone=trusted --add-port=3000/tcp 2>/dev/null || true
  firewall-cmd --permanent --zone=public --add-port=8001/tcp 2>/dev/null || true
  firewall-cmd --permanent --zone=public --add-port=8090/tcp 2>/dev/null || true
  firewall-cmd --permanent --zone=public --add-port=9998/tcp 2>/dev/null || true
  firewall-cmd --permanent --zone=public --add-port=8193/tcp 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
  echo "  [✓] رول‌های Firewalld با موفقیت اعمال شدند."
fi

if command -v iptables >/dev/null 2>&1; then
  iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
fi

# 8. Health Check Verification Probe
sleep 2
SERVER_IP="\$(hostname -I 2>/dev/null | awk '{print \$1}' || ip route get 1 2>/dev/null | awk '{print \$7}' || echo '127.0.0.1')"
HTTP_CODE="\$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" 2>/dev/null || echo "000")"

echo "======================================================================"
if [ "\$HTTP_CODE" = "200" ] || [ "\$HTTP_CODE" = "302" ] || [ "\$HTTP_CODE" = "304" ]; then
  echo "  🎉 [موفقیت‌آمیز] برنامه با موفقیت نصب، دسترسی‌دهی و راه‌اندازی شد!"
else
  echo "  ⚡ [وضعیت سرویس] سرویس استارت شد (پاسخ اولیه: \$HTTP_CODE)."
fi
echo "----------------------------------------------------------------------"
echo "  🌐 آدرس دسترسی به سامانه در مرورگر:"
echo "     http://\${SERVER_IP}:3000"
echo "     http://localhost:3000"
echo ""
echo "  📌 دستورات مفید مدیریت سرویس:"
echo "     sudo systemctl status splunk-doctor    # مشاهده وضعیت"
echo "     sudo systemctl restart splunk-doctor   # راه‌اندازی مجدد"
echo "     sudo journalctl -u splunk-doctor -f    # مشاهده لاگ‌های زنده"
echo "     sudo bash \${TARGET_DIR}/uninstall.sh   # حذف کامل برنامه"
echo "======================================================================"
`;
fs.writeFileSync(path.join(stagingDir, 'setup.sh'), setupScript, { encoding: 'utf8', mode: 0o755 });
fs.writeFileSync(path.join(stagingDir, 'reinstall-and-run.sh'), setupScript, { encoding: 'utf8', mode: 0o755 });

// 7c. Create uninstall.sh
const uninstallScript = `#!/usr/bin/env bash
# ==============================================================================
# uninstall.sh — Clean Uninstaller for Splunk Cluster Doctor
# ==============================================================================
set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root: sudo bash uninstall.sh"
  exit 1
fi

echo "=========================================================="
echo "  Uninstalling Splunk Cluster Doctor..."
echo "=========================================================="

if systemctl is-active --quiet splunk-doctor 2>/dev/null; then
  systemctl stop splunk-doctor 2>/dev/null || true
fi

if systemctl is-enabled --quiet splunk-doctor 2>/dev/null; then
  systemctl disable splunk-doctor 2>/dev/null || true
fi

rm -f /etc/systemd/system/splunk-doctor.service
systemctl daemon-reload 2>/dev/null || true

rm -rf /opt/splunk-doctor

echo "[✓] Splunk Cluster Doctor has been completely uninstalled."
echo "=========================================================="
`;
fs.writeFileSync(path.join(stagingDir, 'uninstall.sh'), uninstallScript, { encoding: 'utf8', mode: 0o755 });


// 8. Create README_RHEL.md (in Persian & English)
const readme = `# راهنمای نصب و راه‌اندازی بسته مستقل اسپلانک کلاستر دکتر (RHEL Standalone UI)
نسخه: ${PACKAGE_VERSION}
تاریخ ساخت: ${BUILD_DATE}

این پکیج شامل نسخه کامل، زنده و مستقل وب و سرور Splunk Cluster Doctor است که قابلیت اجرا روی Red Hat Enterprise Linux (RHEL 8 / 9)، CentOS، Rocky Linux و AlmaLinux را داراست.

## آخرین تغییرات در این نسخه (Changelog):
- **اصلاح کامل جهت فلش‌های پورت ۹۹۹۷ TCP**: فلش‌ها و ذرات متحرک مستقیماً از Heavy Forwarder به سمت بالا و ایندکسرها (Indexer 1 و Indexer 2) اشاره می‌کنند.
- **پایشگر لحظه‌ای پورت‌ها (Instant Port Inspector)**: با کلیک روی هر پورت، پنجره جزییات، پروتکل، فایل کانفیگ حاکم و دستورات تایید سلامت لینوکس نمایش داده می‌شود.
- **موتور پروب زنده TCP Socket**: اضافه شدن اندپوینت‌های تست مستقیم ارتباط با نودهای کلاستر (\`/api/splunk/remote/probe-cluster\`).
- **پیکربندی داینامیک نودها**: همگام‌سازی نام‌ها و آی‌پی‌های سرورها با تنظیمات کلاستر کاربر.

---

## ۱. نحوه اجرای مستقیم و سریع:
\`\`\`bash
# استخراج پکیج
tar -xzf splunk_cluster_doctor_rhel_v${PACKAGE_VERSION}.tar.gz
cd splunk-doctor

# اجرای مستقیم سرور
chmod +x start.sh
./start.sh
\`\`\`
سپس مرورگر خود را باز کرده و به آدرس \`http://<IP_SERVER>:3000\` بروید.

---

## ۲. نصب به صورت سرویس دائمی لینوکس (Systemd Service):
برای اینکه نرم‌افزار به صورت مداوم حتی پس از ریبوت سرور فعال بماند:
\`\`\`bash
sudo bash install-service.sh
\`\`\`

دستورات مدیریت سرویس:
\`\`\`bash
sudo systemctl status splunk-doctor    # بررسی وضعیت
sudo systemctl restart splunk-doctor   # ریستارت
sudo journalctl -u splunk-doctor -f    # لاگ‌های زنده
\`\`\`

---

## ۳. باز کردن پورت در فایروال لینوکس (RHEL Firewalld):
\`\`\`bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
\`\`\`
`;
fs.writeFileSync(path.join(stagingDir, 'README_RHEL.md'), readme, 'utf8');

// 9. Create VERSION and CHANGELOG
const versionInfo = `VERSION=${PACKAGE_VERSION}
BUILD_DATE=${BUILD_DATE}
FEATURES=ARROW_9997_REVERSED,ACTIVE_PORT_INSPECTOR,TCP_PROBE_API,DYNAMIC_NODES
`;
fs.writeFileSync(path.join(stagingDir, 'VERSION'), versionInfo, 'utf8');

// 10. Archive into public directory as both names for backward and forward compatibility
console.log('[RHEL Packager] Finalizing executable permissions in staging tree...');
try {
  execSync(`find "${stagingDir}" -type f \\( -name '*.sh' -o -name '*.bash' -o -name '*.py' -o -name '*.pl' -o -name '*.rb' \\) -exec chmod 755 {} + 2>/dev/null || true`);
} catch (_) {}
for (const executable of [
  path.join(stagingDir, 'node-runtime', 'bin', 'node'),
  path.join(stagingDir, 'kubectl'),
  path.join(stagingDir, 'k3s'),
  path.join(stagingDir, 'bin', 'kubectl')
]) {
  if (fs.existsSync(executable)) {
    try { fs.chmodSync(executable, 0o755); } catch (_) {}
  }
}

console.log('[RHEL Packager] Archiving tar.gz...');
const targetTar1 = path.join(publicDir, 'splunk_doctor_standalone_ui.tar.gz');
const targetTar2 = path.join(publicDir, `splunk_cluster_doctor_rhel_v${PACKAGE_VERSION}.tar.gz`);

// We package the contents inside a 'splunk-doctor' directory inside the tarball so it extracts neatly
const wrappedDir = path.join('/tmp', 'splunk_doctor_wrapper');
if (fs.existsSync(wrappedDir)) {
  fs.rmSync(wrappedDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(wrappedDir, 'splunk-doctor'), { recursive: true });
execSync(`cp -r "${stagingDir}/"* "${path.join(wrappedDir, 'splunk-doctor')}/"`);

execSync(`tar -czf "${targetTar1}" -C "${wrappedDir}" splunk-doctor`);
execSync(`cp "${targetTar1}" "${targetTar2}"`);

console.log(`[RHEL Packager] Generated: ${targetTar1} (${fs.statSync(targetTar1).size} bytes)`);
console.log(`[RHEL Packager] Generated: ${targetTar2} (${fs.statSync(targetTar2).size} bytes)`);
console.log('[RHEL Packager] Done successfully!');
