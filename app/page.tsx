import CameraViewer from "@/components/camera-viewer";
import EventLogger from "@/components/event-logger";

export default function Home() {
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
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <CameraViewer />
          </div>
          <div className="w-full md:w-1/2">
            <EventLogger />
          </div>
        </div>
      </div>
    </main>
  );
}
