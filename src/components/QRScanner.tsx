import { useState, useRef } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface QRResult {
  data: string;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

export default function QRScanner() {
  const [qrResult, setQrResult] = useState<QRResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("🔍 DEBUG: No file selected");
      return;
    }

    console.log("🔍 DEBUG: File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.log("🔍 DEBUG: Invalid file type:", file.type);
      setError("Please select a valid image file");
      return;
    }

    setIsScanning(true);
    setError("");
    setQrResult(null);
    setDebugInfo("Starting file processing...");

    try {
      // Create a preview URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      console.log("🔍 DEBUG: Image URL created:", imageUrl);
      setUploadedImage(imageUrl);

      // Convert image to ImageData for jsQR
      const image = new Image();

      image.onload = () => {
        const imageInfo = {
          width: image.width,
          height: image.height,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        };
        console.log("🔍 DEBUG: Image loaded successfully:", imageInfo);
        setDebugInfo(`Image loaded: ${imageInfo.width}x${imageInfo.height}px`);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          console.error("🔍 DEBUG: Failed to get canvas context");
          setError("Could not create canvas context for image processing");
          setDebugInfo("❌ Failed to create canvas context");
          setIsScanning(false);
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        console.log("🔍 DEBUG: Canvas created:", {
          width: canvas.width,
          height: canvas.height,
        });
        setDebugInfo(`Canvas created: ${canvas.width}x${canvas.height}px`);

        context.drawImage(image, 0, 0);
        console.log("🔍 DEBUG: Image drawn to canvas");
        setDebugInfo("Image drawn to canvas, extracting pixel data...");

        const imageData = context.getImageData(0, 0, image.width, image.height);
        console.log("🔍 DEBUG: ImageData extracted:", {
          width: imageData.width,
          height: imageData.height,
          dataLength: imageData.data.length,
          firstPixels: Array.from(imageData.data.slice(0, 12)), // First 3 pixels (RGBA)
        });
        setDebugInfo(`Pixel data extracted: ${imageData.data.length} bytes`);

        // Scan the image for QR codes using jsQR
        console.log("🔍 DEBUG: Starting jsQR scan...");
        setDebugInfo("🔍 Scanning for QR code...");
        const startTime = performance.now();

        const result = jsQR(imageData.data, image.width, image.height, {
          inversionAttempts: "attemptBoth",
        });

        const endTime = performance.now();
        const scanTime = Math.round(endTime - startTime);
        console.log(`🔍 DEBUG: jsQR scan completed in ${scanTime}ms`);
        console.log("🔍 DEBUG: jsQR result:", result);

        if (result) {
          console.log("🔍 DEBUG: QR code found:", {
            data: result.data,
            location: result.location,
            binaryData: result.binaryData?.length,
            version: result.version,
          });
          setDebugInfo(
            `✅ QR code found in ${scanTime}ms! Data: ${result.data.substring(
              0,
              50
            )}${result.data.length > 50 ? "..." : ""}`
          );

          setQrResult({
            data: result.data,
            location: result.location,
          });
        } else {
          console.log("🔍 DEBUG: No QR code found in image");
          setDebugInfo(`❌ No QR code found (scanned in ${scanTime}ms)`);
          setError(
            "No QR code found in the image. Please try with a clearer image."
          );
        }
        setIsScanning(false);
      };

      image.onerror = (error) => {
        console.error("🔍 DEBUG: Image load error:", error);
        setError(
          "Failed to load the image. Please try with a different image."
        );
        setIsScanning(false);
      };

      console.log("🔍 DEBUG: Setting image source...");
      image.src = imageUrl;
    } catch (err) {
      console.error("🔍 DEBUG: Exception in handleFileUpload:", err);
      setError("An error occurred while processing the image.");
      setIsScanning(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearResults = () => {
    setQrResult(null);
    setError("");
    setUploadedImage("");
    setDebugInfo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async () => {
    if (qrResult?.data) {
      try {
        await navigator.clipboard.writeText(qrResult.data);
        // You could add a toast notification here
        alert("Copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>
            Upload an image containing a QR code to extract its data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={handleButtonClick}
              className="w-full"
              disabled={isScanning}
            >
              {isScanning ? "Scanning..." : "Upload Image"}
            </Button>
          </div>

          {debugInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-xs font-mono">{debugInfo}</p>
            </div>
          )}

          {uploadedImage && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Uploaded Image:</h3>
              <img
                src={uploadedImage}
                alt="Uploaded QR code"
                className="max-w-full h-auto max-h-64 mx-auto rounded-lg border"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {qrResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  QR Code Data Extracted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content:</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-mono text-sm break-all">
                      {qrResult.data}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline">
                    Copy to Clipboard
                  </Button>
                  <Button onClick={clearResults} variant="outline">
                    Scan Another
                  </Button>
                </div>

                {qrResult.data.startsWith("http") && (
                  <div className="pt-2">
                    <a
                      href={qrResult.data}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Open Link
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
