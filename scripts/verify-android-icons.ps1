Add-Type -AssemblyName System.Drawing
$files = @(
  'assets\android-icon-monochrome.png',
  'assets\notification-icon.png',
  'assets\android-icon.png'
)
foreach ($f in $files) {
  if (Test-Path $f) {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $f))
    $size = (Get-Item $f).Length
    $w = $img.Width
    $h = $img.Height
    $pf = $img.PixelFormat
    Write-Output "${f}: ${w}x${h}  ${size} bytes  format=${pf}"
    $img.Dispose()
  } else {
    Write-Output "${f}: MISSING"
  }
}
