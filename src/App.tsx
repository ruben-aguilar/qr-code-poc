import QRScanner from "./components/QRScanner";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            QR Code Scanner
          </h1>
          <p className="text-gray-600">
            Upload an image with a QR code to extract its data
          </p>
          <p className="text-sm text-blue-600 mt-2">
            🇩🇪 Automatically detects and parses German receipt QR codes
          </p>
        </div>
        <QRScanner />
      </div>
    </div>
  );
}

export default App;
