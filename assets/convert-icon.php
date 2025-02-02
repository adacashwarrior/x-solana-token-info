<?php
function resizeWebP($inputFile, $sizes = [16, 48, 128], $outputFormat = 'png') {
    // Load WebP image
    $image = imagecreatefromwebp($inputFile);
    if (!$image) {
        die("Failed to load WebP image.");
    }

    foreach ($sizes as $size) {
        $resizedImage = imagecreatetruecolor($size, $size);

        // Enable transparency support
        imagealphablending($resizedImage, false);
        imagesavealpha($resizedImage, true);

        // Resize
        $width = imagesx($image);
        $height = imagesy($image);
        imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $size, $size, $width, $height);

        // Save as PNG
        $outputFile = "../extension/icon_{$size}x{$size}." . $outputFormat;
        imagepng($resizedImage, $outputFile, 9); // 9 = Max compression

        echo "Generated: $outputFile\n";
        imagedestroy($resizedImage);
    }

    // Cleanup
    imagedestroy($image);
}

// Run conversion
resizeWebP("icon-src5.webp");

echo base64_encode(file_get_contents('../extension/icon_16x16.png'));