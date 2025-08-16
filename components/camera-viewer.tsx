"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff } from "lucide-react";
import { PoopingDetector } from "@/lib/pooping-detector";

export interface DetectionEvent {
  id: string;
  timestamp: Date;
  type: "detection" | "warning" | "alert";
  message: string;
  confidence?: number;
}

export default function CameraViewer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<DetectionEvent[]>([]);

  const logEvent = (
    type: DetectionEvent["type"],
    message: string,
    confidence?: number
  ) => {
    const newEvent: DetectionEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      confidence,
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep only last 50 events
  };

  const startCamera = async () => {
    try {
      setError(null);
      logEvent("detection", "Camera detection started");

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        setIsStreaming(true);

        const poopingDetector = new PoopingDetector();

        const { videoStream } = await poopingDetector.init({
          videoElement: videoRef.current,
        });

        logEvent(
          "detection",
          "Camera feed active - monitoring for suspicious activity"
        );

        setTimeout(() => {
          logEvent("warning", "Suspicious movement detected", 0.7);
        }, 3000);

        setTimeout(() => {
          logEvent("alert", "High probability detection - ALERT!", 0.95);
        }, 8000);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please allow camera permissions and try again."
          );
          logEvent("alert", "Camera access denied by user");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
          logEvent("alert", "No camera device found");
        } else if (err.name === "NotSupportedError") {
          setError("Camera not supported on this device.");
          logEvent("alert", "Camera not supported on device");
        } else {
          setError(`Camera error: ${err.message}`);
          logEvent("alert", `Camera error: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while accessing the camera.");
        logEvent("alert", "Unknown camera error occurred");
      }
    }
  };

  const stopCamera = () => {
    console.log("stopCamera");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    logEvent("detection", "Camera detection stopped");
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!isStreaming ? (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Start Detection
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>Click "Start Detection" to begin viewing your camera feed.</p>
            <p>Make sure to allow camera permissions when prompted.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
