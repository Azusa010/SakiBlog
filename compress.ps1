Add-Type -AssemblyName System.Drawing

$images = Get-ChildItem "public\images\*.jpg"
foreach ($img in $images) {
    Write-Host "Compressing $($img.Name)..."
    
    # Read bytes to avoid locking the file
    $bytes = [System.IO.File]::ReadAllBytes($img.FullName)
    $ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
    $bmp = [System.Drawing.Bitmap]::FromStream($ms)
    
    # Calculate new size (max width 1600)
    $width = $bmp.Width
    $height = $bmp.Height
    if ($width -gt 1600) {
        $ratio = 1600.0 / $width
        $width = 1600
        $height = [math]::Round($height * $ratio)
    }
    
    $newBmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($bmp, 0, 0, $width, $height)
    $g.Dispose()
    
    $newPath = $img.FullName + ".tmp"
    
    $encoder = [System.Drawing.Imaging.Encoder]::Quality
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]60)
    
    $codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders()
    $jpegCodec = $null
    foreach ($codec in $codecs) {
        if ($codec.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid) {
            $jpegCodec = $codec
            break
        }
    }
    
    $newBmp.Save($newPath, $jpegCodec, $encoderParams)
    $newBmp.Dispose()
    $bmp.Dispose()
    $ms.Dispose()
    
    Move-Item -Path $newPath -Destination $img.FullName -Force
    Write-Host "Done $($img.Name)"
}
