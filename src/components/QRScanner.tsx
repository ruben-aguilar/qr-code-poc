import { useState, useRef } from "react";
import jsQR from "jsqr";
import OpenAI from "openai";
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

interface OpenAIResult {
  serialNumber?: string;
  confidence?: string;
  additionalInfo?: string;
}

export default function QRScanner() {
  const [qrResult, setQrResult] = useState<QRResult | null>(null);
  const [openAIResult, setOpenAIResult] = useState<OpenAIResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [openAIApiKey, setOpenAIApiKey] = useState<string>(() => {
    // Load API key from localStorage if available
    return localStorage.getItem("openai_api_key") || "";
  });
  const [showApiKeyField, setShowApiKeyField] = useState<boolean>(
    !openAIApiKey
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to get OpenAI client with current API key
  const getOpenAIClient = () => {
    if (!openAIApiKey) return null;
    return new OpenAI({
      apiKey: openAIApiKey,
      dangerouslyAllowBrowser: true,
    });
  };

  const handleApiKeyChange = (value: string) => {
    setOpenAIApiKey(value);
    // Save to localStorage
    if (value) {
      localStorage.setItem("openai_api_key", value);
    } else {
      localStorage.removeItem("openai_api_key");
    }
  };

  const toggleApiKeyField = () => {
    setShowApiKeyField(!showApiKeyField);
  };

  const validateApiKey = (key: string): boolean => {
    // Basic OpenAI API key validation (starts with sk- and has reasonable length)
    return key.startsWith("sk-") && key.length > 20;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractSerialNumberWithAI = async (
    base64Image: string
  ): Promise<OpenAIResult> => {
    try {
      console.log("🤖 DEBUG: Starting OpenAI Vision analysis...");
      setDebugInfo("🤖 Analyzing image with AI for serial number...");

      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error("OpenAI client not available. Please check API key.");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this ticket/document image and extract the serial number. Look for:
                - Any serial numbers, ticket numbers, or reference numbers
                - Barcodes or QR code content if visible
                - Any alphanumeric identifiers that could be serial numbers
                
                Respond in JSON format with:
                {
                  "serialNumber": "the extracted serial number or null if not found",
                  "confidence": "high/medium/low based on how confident you are",
                  "additionalInfo": "any other relevant information or numbers found"
                }`,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      console.log("🤖 DEBUG: OpenAI response:", content);

      if (content) {
        try {
          const parsed = JSON.parse(content);
          console.log("🤖 DEBUG: Parsed OpenAI result:", parsed);
          return parsed;
        } catch (parseError) {
          console.error(
            "🤖 DEBUG: Failed to parse OpenAI response as JSON:",
            parseError
          );
          return {
            serialNumber: content.substring(0, 100),
            confidence: "low",
            additionalInfo: "Raw response (not JSON)",
          };
        }
      }

      return { additionalInfo: "No response from OpenAI" };
    } catch (error) {
      console.error("🤖 DEBUG: OpenAI Vision error:", error);
      return {
        additionalInfo: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  };

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
    setOpenAIResult(null);
    setDebugInfo("Starting file processing...");

    try {
      // Create a preview URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      console.log("🔍 DEBUG: Image URL created:", imageUrl);
      setUploadedImage(imageUrl);

      // Convert image to base64 for OpenAI Vision API
      const base64Image = await convertFileToBase64(file);
      console.log(
        "🔍 DEBUG: Image converted to base64, length:",
        base64Image.length
      );

      // Convert image to ImageData for jsQR
      const image = new Image();

      image.onload = async () => {
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

        // Now analyze with OpenAI Vision for serial number extraction
        if (openAIApiKey && validateApiKey(openAIApiKey)) {
          setIsAnalyzingWithAI(true);
          try {
            const aiResult = await extractSerialNumberWithAI(base64Image);
            setOpenAIResult(aiResult);
            setDebugInfo((prev) => `${prev} | 🤖 AI analysis complete`);
          } catch (aiError) {
            console.error("🤖 DEBUG: OpenAI analysis failed:", aiError);
            setOpenAIResult({
              additionalInfo:
                "AI analysis failed. Check API key and connection.",
            });
          } finally {
            setIsAnalyzingWithAI(false);
          }
        } else {
          console.log(
            "🤖 DEBUG: OpenAI API key not configured or invalid, skipping AI analysis"
          );
          setOpenAIResult({
            additionalInfo: openAIApiKey
              ? "Invalid OpenAI API key format. Please check your key."
              : "OpenAI API key not configured. Enter your API key below to enable AI analysis.",
          });
        }
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
    setOpenAIResult(null);
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
              disabled={isScanning || isAnalyzingWithAI}
            >
              {isScanning
                ? "Scanning QR Code..."
                : isAnalyzingWithAI
                ? "Analyzing with AI..."
                : "Upload Image"}
            </Button>
          </div>

          {/* OpenAI API Key Configuration */}
          <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-purple-800">
                🤖 AI Serial Number Extraction
              </h3>
              <Button
                onClick={toggleApiKeyField}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {showApiKeyField
                  ? "Hide"
                  : openAIApiKey
                  ? "Edit Key"
                  : "Configure"}
              </Button>
            </div>

            {showApiKeyField && (
              <div className="space-y-2">
                <label className="text-xs text-purple-700">
                  OpenAI API Key (get from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-purple-900"
                  >
                    OpenAI Platform
                  </a>
                  ):
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={openAIApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className={`text-sm ${
                      openAIApiKey && !validateApiKey(openAIApiKey)
                        ? "border-red-300 focus:border-red-500"
                        : openAIApiKey && validateApiKey(openAIApiKey)
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                  />
                  {openAIApiKey && (
                    <Button
                      onClick={() => handleApiKeyChange("")}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {openAIApiKey && !validateApiKey(openAIApiKey) && (
                  <p className="text-xs text-red-600">
                    Invalid API key format. Should start with "sk-" and be
                    longer than 20 characters.
                  </p>
                )}
                {openAIApiKey && validateApiKey(openAIApiKey) && (
                  <p className="text-xs text-green-600">
                    ✅ Valid API key format detected!
                  </p>
                )}
              </div>
            )}

            {!showApiKeyField && (
              <div className="text-xs text-purple-700">
                {openAIApiKey && validateApiKey(openAIApiKey) ? (
                  <span className="text-green-700">✅ AI analysis enabled</span>
                ) : (
                  <span className="text-gray-600">
                    AI analysis disabled - no valid API key
                  </span>
                )}
              </div>
            )}
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

          {openAIResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🤖 AI Analysis Results
                  {isAnalyzingWithAI && (
                    <span className="text-sm text-gray-500">
                      (Analyzing...)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {openAIResult.serialNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Serial Number:
                    </label>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-mono text-sm break-all text-green-800">
                        {openAIResult.serialNumber}
                      </p>
                    </div>
                  </div>
                )}

                {openAIResult.confidence && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Confidence Level:
                    </label>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          openAIResult.confidence === "high"
                            ? "bg-green-100 text-green-800"
                            : openAIResult.confidence === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {openAIResult.confidence.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {openAIResult.additionalInfo && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Additional Information:
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">
                        {openAIResult.additionalInfo}
                      </p>
                    </div>
                  </div>
                )}

                {openAIResult.serialNumber && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          openAIResult.serialNumber!
                        )
                      }
                      variant="outline"
                      size="sm"
                    >
                      Copy Serial Number
                    </Button>
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
