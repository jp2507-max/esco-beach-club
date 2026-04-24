param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination,
  [Parameter(Mandatory=$true)][int]$Size,
  # Fraction of the canvas occupied by the rendered mark (adaptive-icon safe zone ~ 0.66).
  [double]$SafeZone = 0.66
)

Add-Type -AssemblyName System.Drawing

if (
  [double]::IsNaN($SafeZone) -or
  [double]::IsInfinity($SafeZone) -or
  $SafeZone -lt 0.5 -or
  $SafeZone -gt 1.0
) {
  Write-Warning ("SafeZone {0} is out of bounds; using default 0.66." -f $SafeZone)
  $SafeZone = 0.66
}

$resolvedSourcePath = (Resolve-Path -LiteralPath $Source).Path
$src = $null
$canvas = $null
$g = $null
$data = $null

try {
  $src = [System.Drawing.Image]::FromFile($resolvedSourcePath)

  $canvas = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $inner = [int][Math]::Round($Size * $SafeZone)
  $offset = [int](($Size - $inner) / 2)
  $g.DrawImage($src, $offset, $offset, $inner, $inner)

  # Convert every pixel to white-on-transparent (preserving alpha) using LockBits for speed.
  $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  $data = $canvas.LockBits(
    $rect,
    [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )

  $ptr = $data.Scan0
  $stride = $data.Stride
  $bytes = New-Object byte[] ($stride * $Size)
  [System.Runtime.InteropServices.Marshal]::Copy($ptr, $bytes, 0, $bytes.Length)

  for ($y = 0; $y -lt $Size; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $Size; $x++) {
      $i = $row + $x * 4
      # Pixel format is BGRA. Alpha is at +3.
      $a = $bytes[$i + 3]
      if ($a -eq 0) {
        $bytes[$i] = 0
        $bytes[$i + 1] = 0
        $bytes[$i + 2] = 0
      } else {
        $bytes[$i] = 255
        $bytes[$i + 1] = 255
        $bytes[$i + 2] = 255
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
  $canvas.UnlockBits($data)
  $data = $null

  $destinationPath = [System.IO.Path]::GetFullPath($Destination)
  $destinationDirectory = [System.IO.Path]::GetDirectoryName($destinationPath)
  if ($destinationDirectory -and -not (Test-Path -LiteralPath $destinationDirectory)) {
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  }
  $canvas.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("Wrote {0} ({1}x{1})" -f $Destination, $Size)
} finally {
  if ($data -and $canvas) {
    $canvas.UnlockBits($data)
  }
  if ($g) {
    $g.Dispose()
  }
  if ($src) {
    $src.Dispose()
  }
  if ($canvas) {
    $canvas.Dispose()
  }
}
