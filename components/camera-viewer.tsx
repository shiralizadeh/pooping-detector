"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff } from "lucide-react";
import { PoopingDetector } from "@/lib/pooping-detector";
import { DetectedObject } from "@tensorflow-models/coco-ssd";
import { DetectionEvent } from "./event-logger";
import _ from "lodash";

export default function CameraViewer({
  onEvent,
}: {
  onEvent: (detectionEvent: DetectionEvent) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poopingDetectorRef = useRef<PoopingDetector | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logEvent = (
    type: DetectionEvent["type"],
    message: string,
    people?: DetectedObject[],
    dogs?: DetectedObject[]
  ) => {
    const key = [type, people?.length, dogs?.length].join(",");

    const newEvent: DetectionEvent = {
      id: _.times(16, () => ((Math.random() * 0xf) << 0).toString(16)).join(""),
      timestamp: new Date(),
      type,
      message,
      key,
      people,
      dogs,
    };

    onEvent(newEvent);
  };

  const startCamera = async () => {
    try {
      logEvent("detection", "Camera - Detection Started");
      setError(null);

      if (videoRef.current) {
        setIsStreaming(true);

        const poopingDetector = new PoopingDetector({
          videoElement: videoRef.current,
          onEvent: (message: string) => {
            logEvent("info", message);
          },
          onDetected: (people: DetectedObject[], dogs: DetectedObject[]) => {
            logEvent("detected", "Camera - Object Detected", people, dogs);
          },
        });

        await poopingDetector.init();
        await poopingDetector.start();

        poopingDetectorRef.current = poopingDetector;
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
    if (poopingDetectorRef.current) {
      poopingDetectorRef.current.stop();
    }

    setIsStreaming(false);

    logEvent("detection", "Camera - Detection Stopped");
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

          <div className="relative bg-black rounded-lg">
            <video ref={videoRef} className="w-full" playsInline muted />
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
