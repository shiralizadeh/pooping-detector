import * as CocoSSD from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import _ from "lodash";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

export class PoopingDetector {
  videoElement: HTMLVideoElement;
  videoStream?: MediaStream;
  model?: ObjectDetection;

  lastDetectionTick?: number;

  constructor({ videoElement }: { videoElement: HTMLVideoElement }) {
    this.videoElement = videoElement;
  }

  get isStopped() {
    return this.videoElement.readyState == 0;
  }

  async init() {
    const [model, videoStream] = await Promise.all([
      this.setupModel(),
      this.setupCamera(),
    ]);

    return {
      model,
      videoStream,
    };
  }

  async setupCamera() {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);

    this.videoElement.srcObject = this.videoStream;
    this.videoElement.play();

    return this.videoStream;
  }

  async setupModel() {
    this.model = await CocoSSD.load();

    return this.model;
  }

  isPeopleDogsDetected(predictions: DetectedObject[]) {
    const people = _.filter(
      predictions,
      (item: DetectedObject) => item.class == "person" && item.score >= 0.6
    );

    const dogs = _.filter(
      predictions,
      (item: DetectedObject) =>
        item.class == "potted plant" && item.score >= 0.6
    );

    console.log(predictions.map((item) => item.class).toString());

    return {
      isDetected: people.length > 0 && dogs.length > 0,
      people,
      dogs,
    };
  }

  async start({
    onEvent,
  }: {
    onEvent: (people: DetectedObject[], dogs: DetectedObject[]) => void;
  }) {
    const detect = () => {
      if (this.isStopped) return;

      this.model?.detect(this.videoElement).then((predictions) => {
        const { isDetected, people, dogs } =
          this.isPeopleDogsDetected(predictions);

        if (isDetected) {
          onEvent(people, dogs);
        }

        requestAnimationFrame(() => detect());
      });
    };

    this.videoElement.addEventListener("loadeddata", async () => {
      detect();
    });
  }

  async stop() {}
}
