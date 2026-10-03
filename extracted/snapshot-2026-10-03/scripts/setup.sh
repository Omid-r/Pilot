#!/usr/bin/env bash
# ==============================================================================
# setup.sh — MASTER ALL-IN-ONE DEPLOYER & SELF-HEALER
# نسخه نصب و راه‌اندازی ۱۰۰٪ خودکار بدون نیاز به حذف دستی و تغییر مجوزها
# ==============================================================================

set -e

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
TARGET_DIR="/opt/splunk-doctor"
DATA_DIR="/var/lib/splunk-doctor"

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
echo "==> [۲/۶] آماده‌سازی دایرکتوری هدف (${TARGET_DIR})..."
mkdir -p "${TARGET_DIR}"
rm -rf "${TARGET_DIR}/dist" "${TARGET_DIR}/scripts" "${TARGET_DIR}/systemd" "${TARGET_DIR}/offline-prereqs" 2>/dev/null || true

# 4. Copy current package files
echo "==> [۳/۶] کپی و استقرار فایل‌های بسته جدید..."
cp -rf "${SOURCE_DIR}"/* "${TARGET_DIR}/"

# 5. Install every bundled user-space prerequisite from local RPMs/binaries only.
# This deliberately happens before recursive permission normalization so a
# minimal RHEL install without findutils can bootstrap itself from the bundle.
echo "==> [۴/۶] نصب تمام پیش‌نیازهای آفلاین RHEL از روی مدیا..."
bash "${TARGET_DIR}/scripts/install-offline-prereqs.sh"

# Install safe permissions; do not make every config/data file executable.
echo "==> [۴.۵/۶] اعمال مجوزهای امن و اجرایی..."
find "${TARGET_DIR}" -type d -exec chmod 755 {} +
find "${TARGET_DIR}" -type f -exec chmod 644 {} +
chmod +x "${TARGET_DIR}"/*.sh "${TARGET_DIR}"/scripts/*.sh 2>/dev/null || true

# Private runtime state and secrets live outside the application tree.
mkdir -p "${DATA_DIR}"
chmod 700 "${DATA_DIR}"

# Use the Node runtime packaged with the offline bundle.
NODE_BIN="${TARGET_DIR}/node-runtime/bin/node"
if [ ! -x "$NODE_BIN" ]; then
  echo "[-] Bundled Node.js runtime is missing or not executable."
  exit 1
fi
echo "  -> Node.js: $("$NODE_BIN" --version) ($NODE_BIN)"

if command -v restorecon >/dev/null 2>&1; then
  restorecon -RF "${TARGET_DIR}" "${DATA_DIR}" || true
fi

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
WorkingDirectory=${TARGET_DIR}
ExecStart=${NODE_BIN} ${TARGET_DIR}/dist/server.cjs
UMask=0077
Restart=always
RestartSec=3
KillMode=process
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SPLUNK_HOME=/opt/splunk
Environment=SPLUNK_DOCTOR_DATA_DIR=${DATA_DIR}

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
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo '127.0.0.1')"
HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" 2>/dev/null || echo "000")"

echo "======================================================================"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "304" ]; then
  echo "  🎉 [موفقیت‌آمیز] برنامه با موفقیت نصب، دسترسی‌دهی و راه‌اندازی شد!"
else
  echo "  ⚡ [وضعیت سرویس] سرویس استارت شد (پاسخ اولیه: $HTTP_CODE)."
fi
echo "----------------------------------------------------------------------"
echo "  🌐 آدرس دسترسی به سامانه در مرورگر:"
echo "     http://${SERVER_IP}:3000"
echo "     http://localhost:3000"
echo ""
echo "  ✅ تمامی وابستگی‌های user-space از همین رسانه نصب شدند؛ در زمان نصب هیچ repository خارجی استفاده نشد."
echo "  ⚠️ خود RHEL kernel/systemd جزء سیستم‌عامل میزبان هستند و داخل این برنامه جایگزین نمی‌شوند."
echo ""
echo "  📌 دستورات مفید مدیریت سرویس:"
echo "     sudo systemctl status splunk-doctor    # مشاهده وضعیت"
echo "     sudo systemctl restart splunk-doctor   # راه‌اندازی مجدد"
echo "     sudo journalctl -u splunk-doctor -f    # مشاهده لاگ‌های زنده"
echo "     sudo bash ${TARGET_DIR}/uninstall.sh   # حذف کامل برنامه"
echo "======================================================================"
