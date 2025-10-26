# Sample Images for Encryption Testing

This directory contains sample image files designed for testing the Secure File Exchange System's image encryption capabilities.

## Sample Files

### company-logo-small.png
- **Size**: ~30KB
- **Purpose**: Testing encryption performance with small image files
- **Use Case**: Profile pictures, small logos
- **Expected Performance**: Fast encryption/decryption across all algorithms

### company-logo-medium.jpg
- **Size**: ~250KB
- **Purpose**: Testing encryption performance with medium-sized image files
- **Use Case**: Company logos, standard images
- **Expected Performance**: Moderate encryption/decryption times

### company-logo-large.png
- **Size**: ~1.2MB
- **Purpose**: Testing encryption performance with large image files
- **Use Case**: High-resolution images, detailed graphics
- **Expected Performance**: Longer encryption/decryption times, good for algorithm comparison

## Testing Scenarios

1. **Upload Performance**: Test how quickly each image uploads and encrypts
2. **Algorithm Comparison**: Compare AES, DES, and RC4 performance on different image sizes
3. **Storage Efficiency**: Analyze ciphertext size differences between algorithms
4. **Access Control**: Test sharing and access permissions for image files

## File Format Notes

- **PNG files**: Typically have better compression for logos and graphics
- **JPEG files**: Better for photographs and complex images
- Both formats are supported by the system's file type validation

## Security Testing

Each image will be:
1. Encrypted with AES-256-CBC
2. Encrypted with DES-CBC
3. Encrypted with RC4
4. Stored with separate access controls
5. Available for performance metrics collection

## Usage Instructions

1. Upload these files through the web interface
2. Monitor encryption performance metrics
3. Test file sharing functionality
4. Verify decryption accuracy
5. Compare algorithm performance across different file sizes

Note: These are synthetic test files created specifically for encryption testing purposes.
