"use client";

import CameraViewer from "@/components/camera-viewer";
import EventLogger, { DetectionEvent } from "@/components/event-logger";
import { useState } from "react";

export default function Home() {
  const [events, setEvents] = useState<DetectionEvent[]>([]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Pooping 💩 Detector
          </h1>
          <p className="text-muted-foreground">
            Let's detect and warn them before they do it!
          </p>
        </div>
        <div className="flex flex-col items-stretch md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <CameraViewer
              onEvent={(newEvent) => {
                if (newEvent.type == "detected" || newEvent.type == "warning") {
                  setEvents((events) => {
                    const preEvent = events[0];

                    if (preEvent.key == newEvent.key) {
                      return [newEvent, ...events.slice(1)];
                    } else {
                      return [newEvent, ...events];
                    }
                  });
                } else {
                  setEvents((events) => [newEvent, ...events]);
                }
              }}
            />
          </div>
          <div className="w-full md:w-1/2">
            <EventLogger events={events} />
          </div>
        </div>
      </div>
    </main>
  );
}
