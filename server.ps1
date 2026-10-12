# GAME HUB portable server (PowerShell, zero dependencies)
# Same behavior as server.py: serves the folder on localhost:8123 and shuts
# itself down ~12s after the last app window closes (heartbeat-based).
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8123

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
try { $listener.Start() } catch { exit }   # already running

$lastBeat  = Get-Date
$openPages = 0
$graceEnd  = (Get-Date).AddSeconds(30)
$idleSince = $null

$mime = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='application/javascript';
  '.json'='application/manifest+json'; '.png'='image/png'; '.jpg'='image/jpeg';
  '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.txt'='text/plain'; '.webp'='image/webp'
}

function Send-Bytes($stream, [byte[]]$bytes) { $stream.Write($bytes, 0, $bytes.Length) }
function Send-Text($stream, [string]$text)  { Send-Bytes $stream ([System.Text.Encoding]::ASCII.GetBytes($text)) }

Write-Host "GameHub server on http://localhost:$port - closes automatically with the app window."

while ($true) {
  if ($listener.Pending()) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $stream.ReadTimeout = 3000
      $reader = New-Object System.IO.StreamReader($stream)
      $reqLine = $reader.ReadLine()
      while ($true) { $h = $reader.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }

      if ($reqLine -match '^(GET|POST)\s+(\S+)') {
        $path = $Matches[2].Split('?')[0]
        $lastBeat = Get-Date

        if ($path -like '/__*') {
          if ($path -like '*__hi*')  { $openPages++ }
          elseif ($path -like '*__bye*') { $openPages = [Math]::Max(0, $openPages - 1) }
          Send-Text $stream "HTTP/1.1 204 No Content`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
        }
        else {
          if ($path -eq '/') { $path = '/index.html' }
          $rel  = [System.Uri]::UnescapeDataString($path.TrimStart('/')) -replace '/', '\'
          $file = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
          if ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            $ct = $mime[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
            Send-Text  $stream "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
            Send-Bytes $stream $bytes
          } else {
            Send-Text $stream "HTTP/1.1 404 Not Found`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
          }
        }
      }
      $stream.Flush()
    } catch {}
    $client.Close()
  }
  else {
    Start-Sleep -Milliseconds 200
    $now = Get-Date
    if ($now -gt $graceEnd) {
      if (($now - $lastBeat).TotalSeconds -gt 300) { break }          # crash backstop
      if ($openPages -le 0) {
        if ($null -eq $idleSince) { $idleSince = $now }
        elseif (($now - $idleSince).TotalSeconds -gt 12) { break }    # app window closed
      } else { $idleSince = $null }
    }
  }
}

Write-Host 'GameHub closed - shutting down server.'
$listener.Stop()
