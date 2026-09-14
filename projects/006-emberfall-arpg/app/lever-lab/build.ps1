param([string]$GodotPath = '')
$ErrorActionPreference = 'Stop'
if (-not $GodotPath) {
    $GodotPath = Join-Path $PSScriptRoot '..\..\..\..\.tmp\godot-runtime\Godot_v4.5.1-stable_win64_console.exe'
}
$GodotPath = (Resolve-Path -LiteralPath $GodotPath).Path
& $GodotPath --headless --path $PSScriptRoot --script res://test_lab.gd -- --test-mode
if ($LASTEXITCODE -ne 0) { throw 'Laboratory verification failed.' }
& $GodotPath --headless --path $PSScriptRoot --script res://pack.gd
if ($LASTEXITCODE -ne 0) { throw 'PCK creation failed.' }
$runtimePath = $GodotPath -replace '_console\.exe$', '.exe'
Copy-Item -LiteralPath $runtimePath -Destination (Join-Path $PSScriptRoot 'dist\LeverLab.exe') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'GODOT-LICENSE.txt') -Destination (Join-Path $PSScriptRoot 'dist\GODOT-LICENSE.txt') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'GODOT-COPYRIGHT.txt') -Destination (Join-Path $PSScriptRoot 'dist\GODOT-COPYRIGHT.txt') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination (Join-Path $PSScriptRoot 'dist\README.md') -Force
Write-Output 'Built dist\LeverLab.exe with adjacent LeverLab.pck. Keep both files together.'
