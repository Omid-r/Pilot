param([Parameter(Mandatory=$true)][string]$ArtifactZip,[int]$Port=8765,[string]$BindAddress="0.0.0.0")
$ErrorActionPreference="Stop"
$root=Join-Path $env:TEMP ("pilot-fast-patch-"+[guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $root | Out-Null
try {
  Expand-Archive -LiteralPath $ArtifactZip -DestinationPath $root -Force
  $patch=Get-ChildItem -Path $root -Recurse -Filter "splunk-doctor-dist-*.tar.gz" | Select-Object -First 1
  if(-not $patch){throw "Fast patch tar.gz was not found."}
  $sha=Get-ChildItem -Path $root -Recurse -Filter "splunk-doctor-dist-*.tar.gz.sha256" | Select-Object -First 1
  if($sha){$expected=((Get-Content $sha.FullName -Raw).Trim()-split "\s+")[0].ToLowerInvariant();$actual=(Get-FileHash -Algorithm SHA256 $patch.FullName).Hash.ToLowerInvariant();if($expected-ne$actual){throw "SHA256 mismatch."}}
  $serve=Join-Path $root "serve";New-Item -ItemType Directory -Path $serve|Out-Null
  Copy-Item $patch.FullName $serve -Force;if($sha){Copy-Item $sha.FullName $serve -Force}
  $ip="192.168.231.110"
  Write-Host "Fast patch: $($patch.Name)"
  Write-Host "RHEL: curl -f http://$ip`:$Port/$($patch.Name) -o /tmp/$($patch.Name)"
  Write-Host "RHEL: sudo bash /opt/splunk-doctor/scripts/deploy-fast-dist.sh /tmp/$($patch.Name)"
  $python=(Get-Command python.exe -ErrorAction SilentlyContinue).Source;if(-not$python){throw "python.exe is required."}
  & $python -m http.server $Port --bind $BindAddress --directory $serve
} finally {Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue}