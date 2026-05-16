Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height,
    [System.Drawing.Color]$Background
  )

  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear($Background)

  return [PSCustomObject]@{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Remove-Background {
  param(
    [string]$SourcePath
  )

  $source = [System.Drawing.Bitmap]::FromFile($SourcePath)
  $result = New-Object System.Drawing.Bitmap $source.Width, $source.Height

  for ($x = 0; $x -lt $source.Width; $x++) {
    for ($y = 0; $y -lt $source.Height; $y++) {
      $pixel = $source.GetPixel($x, $y)
      $redScore = $pixel.R - ([Math]::Max($pixel.G, $pixel.B))
      $redEnergy = $pixel.R - (($pixel.G + $pixel.B) / 2.0)

      if ($pixel.R -lt 60 -or $redEnergy -lt 24) {
        $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        continue
      }

      if ($pixel.R -lt 110 -or $redScore -lt 40) {
        $alpha = [Math]::Max(0, [Math]::Min(255, ($pixel.R - 60) * 5))
        $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        continue
      }

      if ($pixel.R -lt 145 -or $redScore -lt 65) {
        $alpha = [Math]::Max(120, [Math]::Min(255, ($pixel.R - 70) * 3))
        $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        continue
      }

      $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
    }
  }

  $source.Dispose()
  return $result
}

function Get-ContentBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($x = 0; $x -lt $Bitmap.Width; $x++) {
    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
      if ($Bitmap.GetPixel($x, $y).A -gt 10) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0) {
    throw "Could not detect visible content in source image."
  }

  return [System.Drawing.Rectangle]::FromLTRB($minX, $minY, $maxX + 1, $maxY + 1)
}

function New-CroppedBitmap {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [System.Drawing.Rectangle]$Bounds
  )

  $cropped = New-Object System.Drawing.Bitmap $Bounds.Width, $Bounds.Height
  $graphics = [System.Drawing.Graphics]::FromImage($cropped)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($Bitmap, (New-Object System.Drawing.Rectangle 0, 0, $Bounds.Width, $Bounds.Height), $Bounds, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  return $cropped
}

function Draw-CenteredImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Bitmap,
    [float]$CanvasWidth,
    [float]$CanvasHeight,
    [float]$MaxWidth,
    [float]$MaxHeight,
    [float]$OffsetX = 0,
    [float]$OffsetY = 0
  )

  $scale = [Math]::Min($MaxWidth / $Bitmap.Width, $MaxHeight / $Bitmap.Height)
  $width = $Bitmap.Width * $scale
  $height = $Bitmap.Height * $scale
  $x = (($CanvasWidth - $width) / 2) + $OffsetX
  $y = (($CanvasHeight - $height) / 2) + $OffsetY
  $Graphics.DrawImage($Bitmap, $x, $y, $width, $height)
}

function New-GlowBitmap {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Padding
  )

  $glow = New-Object System.Drawing.Bitmap ($Source.Width + $Padding * 2), ($Source.Height + $Padding * 2)

  for ($x = 0; $x -lt $Source.Width; $x++) {
    for ($y = 0; $y -lt $Source.Height; $y++) {
      $pixel = $Source.GetPixel($x, $y)
      if ($pixel.A -gt 20) {
        $alpha = [Math]::Min(120, [int]($pixel.A * 0.35))
        $glow.SetPixel($x + $Padding, $y + $Padding, [System.Drawing.Color]::FromArgb($alpha, 180, 0, 0))
      }
    }
  }

  return $glow
}

function Draw-SoftGlow {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [int]$Alpha,
    [string]$ColorHex
  )

  $brush = New-Object System.Drawing.Drawing2D.GraphicsPath
  $brush.AddEllipse($X, $Y, $Width, $Height)
  $gradient = New-Object System.Drawing.Drawing2D.PathGradientBrush($brush)
  $baseColor = [System.Drawing.ColorTranslator]::FromHtml($ColorHex)
  $gradient.CenterColor = [System.Drawing.Color]::FromArgb($Alpha, $baseColor.R, $baseColor.G, $baseColor.B)
  $gradient.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $baseColor.R, $baseColor.G, $baseColor.B))
  $Graphics.FillEllipse($gradient, $X, $Y, $Width, $Height)
  $gradient.Dispose()
  $brush.Dispose()
}

function Draw-Icon {
  param(
    [string]$Path,
    [System.Drawing.Bitmap]$Logo,
    [int]$Size
  )

  $surface = New-Canvas -Width $Size -Height $Size -Background ([System.Drawing.Color]::FromArgb(255, 5, 5, 5))
  $graphics = $surface.Graphics
  $bitmap = $surface.Bitmap

  $panelPath = New-RoundedRectPath -X ($Size * 0.05) -Y ($Size * 0.05) -Width ($Size * 0.90) -Height ($Size * 0.90) -Radius ($Size * 0.11)
  $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 11, 11))
  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 45, 45, 45)), ($Size * 0.004)
  $graphics.FillPath($panelBrush, $panelPath)
  $graphics.DrawPath($borderPen, $panelPath)

  Draw-CenteredImage -Graphics $graphics -Bitmap $Logo -CanvasWidth $Size -CanvasHeight $Size -MaxWidth ($Size * 0.72) -MaxHeight ($Size * 0.72)

  Save-Png -Bitmap $bitmap -Path $Path

  $borderPen.Dispose()
  $panelBrush.Dispose()
  $panelPath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-AdaptiveIcon {
  param(
    [string]$Path,
    [System.Drawing.Bitmap]$Logo,
    [int]$Size
  )

  $surface = New-Canvas -Width $Size -Height $Size -Background ([System.Drawing.Color]::Transparent)
  $graphics = $surface.Graphics
  $bitmap = $surface.Bitmap

  $circleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 10, 10))
  $circlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 54, 54, 54)), ($Size * 0.003)
  $circleSize = $Size * 0.78
  $circleX = ($Size - $circleSize) / 2
  $circleY = ($Size - $circleSize) / 2
  $graphics.FillEllipse($circleBrush, $circleX, $circleY, $circleSize, $circleSize)
  $graphics.DrawEllipse($circlePen, $circleX, $circleY, $circleSize, $circleSize)

  Draw-CenteredImage -Graphics $graphics -Bitmap $Logo -CanvasWidth $Size -CanvasHeight $Size -MaxWidth ($Size * 0.54) -MaxHeight ($Size * 0.54)

  Save-Png -Bitmap $bitmap -Path $Path

  $circlePen.Dispose()
  $circleBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-Splash {
  param(
    [string]$Path,
    [System.Drawing.Bitmap]$Logo,
    [System.Drawing.Bitmap]$Glow,
    [int]$Size
  )

  $surface = New-Canvas -Width $Size -Height $Size -Background ([System.Drawing.Color]::FromArgb(255, 3, 3, 3))
  $graphics = $surface.Graphics
  $bitmap = $surface.Bitmap

  Draw-SoftGlow -Graphics $graphics -X ($Size * 0.38) -Y ($Size * 0.14) -Width ($Size * 0.42) -Height ($Size * 0.38) -Alpha 72 -ColorHex "#9E0000"
  Draw-SoftGlow -Graphics $graphics -X ($Size * 0.27) -Y ($Size * 0.22) -Width ($Size * 0.34) -Height ($Size * 0.28) -Alpha 48 -ColorHex "#4D0000"
  Draw-SoftGlow -Graphics $graphics -X ($Size * 0.14) -Y ($Size * 0.78) -Width ($Size * 0.52) -Height ($Size * 0.06) -Alpha 110 -ColorHex "#C40000"
  Draw-SoftGlow -Graphics $graphics -X ($Size * 0.18) -Y ($Size * 0.74) -Width ($Size * 0.44) -Height ($Size * 0.12) -Alpha 34 -ColorHex "#740000"

  Draw-CenteredImage -Graphics $graphics -Bitmap $Logo -CanvasWidth $Size -CanvasHeight $Size -MaxWidth ($Size * 0.44) -MaxHeight ($Size * 0.44) -OffsetX (-$Size * 0.08) -OffsetY (-$Size * 0.02)

  Save-Png -Bitmap $bitmap -Path $Path

  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-Favicon {
  param(
    [string]$Path,
    [System.Drawing.Bitmap]$Logo,
    [int]$Size
  )

  Draw-Icon -Path $Path -Logo $Logo -Size $Size
}

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root "assets"
$sourcePath = Join-Path $root "temp\\logo_dumbell.png"

if (-not (Test-Path $sourcePath)) {
  throw "Source file not found: $sourcePath"
}

$transparentLogo = Remove-Background -SourcePath $sourcePath
$contentBounds = Get-ContentBounds -Bitmap $transparentLogo
$croppedLogo = New-CroppedBitmap -Bitmap $transparentLogo -Bounds $contentBounds
$glowLogo = New-GlowBitmap -Source $croppedLogo -Padding 26

Draw-Icon -Path (Join-Path $assetsDir "icon.png") -Logo $croppedLogo -Size 1024
Draw-AdaptiveIcon -Path (Join-Path $assetsDir "adaptive-icon.png") -Logo $croppedLogo -Size 1024
Draw-Splash -Path (Join-Path $assetsDir "splash-icon.png") -Logo $croppedLogo -Glow $glowLogo -Size 512
Draw-Favicon -Path (Join-Path $assetsDir "favicon.png") -Logo $croppedLogo -Size 256

$glowLogo.Dispose()
$croppedLogo.Dispose()
$transparentLogo.Dispose()
