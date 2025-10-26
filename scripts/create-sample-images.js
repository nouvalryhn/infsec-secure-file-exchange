const fs = require('fs');
const path = require('path');

/**
 * Creates sample image files for testing image encryption
 * These are simple binary files that simulate different image sizes
 */
function createSampleImages() {
  const templatesDir = path.join(__dirname, '..', 'public', 'templates');
  
  // Sample image configurations
  const imageConfigs = [
    {
      filename: 'company-logo-small.png',
      size: 30 * 1024, // 30KB
      description: 'Small company logo for minimal encryption testing'
    },
    {
      filename: 'company-logo-medium.jpg',
      size: 250 * 1024, // 250KB
      description: 'Medium company logo for standard encryption testing'
    },
    {
      filename: 'company-logo-large.png',
      size: 1.2 * 1024 * 1024, // 1.2MB
      description: 'Large company logo for performance encryption testing'
    }
  ];

  console.log('Creating sample image files...');

  imageConfigs.forEach(config => {
    const filePath = path.join(templatesDir, config.filename);
    
    // Create a simple binary pattern that resembles image data
    const buffer = Buffer.alloc(Math.floor(config.size));
    
    // Fill with a pattern that simulates image data
    // PNG/JPEG files have specific headers and patterns
    for (let i = 0; i < buffer.length; i++) {
      if (config.filename.endsWith('.png')) {
        // Simulate PNG-like data pattern
        if (i < 8) {
          // PNG signature
          const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
          buffer[i] = pngSignature[i] || 0;
        } else {
          // Random-ish data that looks like compressed image data
          buffer[i] = (i * 37 + 123) % 256;
        }
      } else if (config.filename.endsWith('.jpg')) {
        // Simulate JPEG-like data pattern
        if (i < 2) {
          // JPEG signature
          buffer[i] = i === 0 ? 0xFF : 0xD8;
        } else {
          // Random-ish data that looks like compressed image data
          buffer[i] = (i * 73 + 89) % 256;
        }
      }
    }
    
    // Write the file
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ Created ${config.filename} (${Math.round(config.size / 1024)}KB)`);
  });

  // Create a README file explaining the sample images
  const readmeContent = `# Sample Images for Encryption Testing

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
`;

  const readmePath = path.join(templatesDir, 'SAMPLE_IMAGES_README.md');
  fs.writeFileSync(readmePath, readmeContent);
  console.log('✓ Created SAMPLE_IMAGES_README.md');

  console.log('\nSample images created successfully!');
  console.log('Total files created: 4 (3 images + 1 README)');
}

// Create the sample images
createSampleImages();