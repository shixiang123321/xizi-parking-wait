@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173/' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if errorlevel 1 (
  start "Marketeam Preview Server" /min cmd /k "cd /d ""%~dp0"" && npm run dev -- --host 127.0.0.1 --port 4173"
)

powershell -NoProfile -Command "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173/' -TimeoutSec 2; if ($response.StatusCode -eq 200) { $ready = $true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if ($ready) { Start-Process 'http://127.0.0.1:4173/' } else { Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('The preview server did not start. Please make sure Node.js is installed.', 'Marketeam') }"

endlocal
