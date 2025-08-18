"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Eye, Trash2, Clock } from "lucide-react";
import { DetectedObject } from "@tensorflow-models/coco-ssd";

export interface DetectionEvent {
  id: string;
  type: "detection" | "detected" | "warning" | "alert";
  message: string;
  timestamp: Date;
  key?: string;
  people?: DetectedObject[];
  dogs?: DetectedObject[];
}

function roundScore(score: number) {
  return (Math.round(score * 100) / 100) * 100;
}

export default function EventLogger({ events }: { events: DetectionEvent[] }) {
  const onClearEvents = () => {
    // setEvents([]);
  };

  const getEventIcon = (type: DetectionEvent["type"]) => {
    switch (type) {
      case "detection":
        return <Eye className="h-4 w-4" />;
      case "detected":
        return <span>💩</span>;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventBadgeVariant = (type: DetectionEvent["type"]) => {
    switch (type) {
      case "detection":
        return "secondary";
      case "detected":
        return "destructive";
      case "warning":
        return "outline";
      case "alert":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Detection Events</CardTitle>
        </div>
        {events.length > 0 && (
          <Button
            onClick={onClearEvents}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-transparent"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[480px] w-full">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events logged yet</p>
              <p className="text-sm">Start detection to see events here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getEventBadgeVariant(event.type)}
                        className="text-xs"
                      >
                        {event.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">
                      {event.message}
                    </p>
                    <p className="flex gap-1 text-sm text-foreground break-words">
                      {event.people?.map((person) => (
                        <div
                          key={person.score}
                          className="border border-red-500 p-1 rounded w-20"
                        >
                          🧍‍♂️ {roundScore(person.score)}%
                        </div>
                      ))}
                      {event.dogs?.map((dog) => (
                        <div
                          key={dog.score}
                          className="border border-green-500 p-1 rounded w-20"
                        >
                          🐶 {roundScore(dog.score)}%
                        </div>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
