# QR Code Scanner

A modern web application built with Vite, React, TypeScript, and ShadCN UI that allows users to upload images containing QR codes and extract their data.

## Features

- **Image Upload**: Upload images containing QR codes from your device
- **QR Code Detection**: Automatically detects and extracts data from QR codes using jsQR
- **AI-Powered Serial Number Extraction**: Uses OpenAI GPT-4 Vision to extract serial numbers from tickets and documents
- **Data Display**: Shows both QR code content and AI-extracted serial numbers in a clean, readable format
- **Copy to Clipboard**: Easy one-click copying of extracted data and serial numbers
- **Link Detection**: Automatically detects and provides clickable links for URLs
- **Debug Mode**: Real-time debug information to track processing steps
- **Modern UI**: Beautiful, responsive interface built with ShadCN UI and Tailwind CSS

## Technologies Used

- **Vite** - Fast build tool and dev server
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe JavaScript
- **ShadCN UI** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **jsQR** - Pure JavaScript QR code reading library
- **OpenAI GPT-4 Vision** - AI-powered image analysis for serial number extraction

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

1. **Configure AI (Optional)**: Click "Configure" in the purple AI section to add your OpenAI API key for serial number extraction
2. **Upload an Image**: Click the "Upload Image" button and select an image file containing a QR code or ticket
3. **QR Code Scanning**: The application automatically scans for QR codes using jsQR
4. **AI Analysis**: If OpenAI API key is configured, GPT-4 Vision will analyze the image for serial numbers
5. **View Results**: Both QR code data and AI-extracted serial numbers are displayed
6. **Copy Data**: Use the "Copy to Clipboard" buttons to copy extracted data or serial numbers
7. **Open Links**: If the QR code contains a URL, click "Open Link" to navigate to it
8. **Debug Information**: Watch the blue debug box for real-time processing information
9. **Scan Another**: Use "Scan Another" to clear results and upload a new image

### AI Configuration

- Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Enter it in the purple "AI Serial Number Extraction" section
- Your API key is stored locally in your browser and never sent anywhere except directly to OpenAI
- You can edit or clear your API key anytime using the "Edit Key" button

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

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

### Setup Instructions:

1. **Push your code to GitHub** in a repository (e.g., `username/qr-poc`)

2. **Enable GitHub Pages** in your repository:

   - Go to your repository settings
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"

3. **Automatic Deployment**:

   - The workflow triggers automatically on pushes to the `main` branch
   - Uses Yarn for faster, more reliable dependency installation
   - You can also trigger it manually from the Actions tab
   - Your app will be available at: `https://username.github.io/repository-name/`

4. **Update Repository Name** (if different):
   - If your repository isn't named `qr-poc`, update the `base` path in `vite.config.ts`
   - Change `/qr-poc/` to `/your-repository-name/`

### Manual Deployment:

You can also trigger deployment manually:

- Go to the "Actions" tab in your GitHub repository
- Click on "Deploy to GitHub Pages" workflow
- Click "Run workflow" button

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
