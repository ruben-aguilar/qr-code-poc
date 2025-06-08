# QR Code Scanner

A modern web application built with Vite, React, TypeScript, and ShadCN UI that allows users to upload images containing QR codes and extract their data.

## Features

- **Image Upload**: Upload images containing QR codes from your device
- **QR Code Detection**: Automatically detects and extracts data from QR codes
- **Data Display**: Shows the extracted QR code content in a clean, readable format
- **Copy to Clipboard**: Easy one-click copying of extracted data
- **Link Detection**: Automatically detects and provides clickable links for URLs
- **Modern UI**: Beautiful, responsive interface built with ShadCN UI and Tailwind CSS

## Technologies Used

- **Vite** - Fast build tool and dev server
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe JavaScript
- **ShadCN UI** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **qr-scanner** - High-performance QR code scanning library

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd qr-poc
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Upload an Image**: Click the "Upload Image" button and select an image file containing a QR code
2. **View Results**: The application will automatically scan the image and display the extracted data
3. **Copy Data**: Use the "Copy to Clipboard" button to copy the extracted text
4. **Open Links**: If the QR code contains a URL, click "Open Link" to navigate to it
5. **Scan Another**: Use "Scan Another" to clear results and upload a new image

## Supported File Types

- PNG
- JPEG/JPG
- GIF
- BMP
- WebP

## Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
