import * as CocoSSD from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

export class PoopingDetector {
  videoElement: HTMLVideoElement;
  videoStream: any;
  model: any;

  constructor() {}

  async init({ videoElement }: { videoElement: HTMLVideoElement }) {
    const [model, videoStream] = await Promise.all([
      this.setupModel(),
      this.setupCamera(videoElement),
    ]);

    this.videoElement.addEventListener("loadeddata", async () => {
      this.start();
    });

    return {
      model,
      videoStream,
    };
  }

  async setupCamera(videoElement: HTMLVideoElement) {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoElement = videoElement;

    videoElement.srcObject = this.videoStream;
    videoElement.play();

    return this.videoStream;
  }

  async setupModel() {
    this.model = await CocoSSD.load();

    return this.model;
  }

  async start() {
    const detect = () => {
      if (this.videoElement.readyState == 0) return;

      this.model.detect(this.videoElement).then(function (predictions: any) {
        console.log(
          predictions.map((item: any) => item.class).toString(),
          predictions
        );

        requestAnimationFrame(() => detect());
      });
    };

    detect();
  }

  async stop() {}
}
