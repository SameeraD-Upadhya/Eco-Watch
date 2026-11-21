# EcoWatch Windows PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "EcoWatch: Civic Environmental Monitoring System"
Write-Host "Starting EcoWatch..." -ForegroundColor Green
$ScriptPath = Join-Path $PSScriptRoot "run_app.py"
python $ScriptPath
