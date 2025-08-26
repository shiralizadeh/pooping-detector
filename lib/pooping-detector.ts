import _ from "lodash";
import * as CocoSSD from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

export class PoopingDetector {
  videoElement: HTMLVideoElement;
  videoStream?: MediaStream;
  model?: ObjectDetection;

  isActive: boolean;

  onEvent: (message: string) => void;
  onDetected: (people: DetectedObject[], dogs: DetectedObject[]) => void;

  constructor({
    videoElement,
    onEvent,
    onDetected,
  }: {
    videoElement: HTMLVideoElement;
    onEvent: PoopingDetector["onEvent"];
    onDetected: PoopingDetector["onDetected"];
  }) {
    this.videoElement = videoElement;
    this.onEvent = onEvent;
    this.onDetected = onDetected;

    this.isActive = false;
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
    this.onEvent("Setup Camera Access");

    const constraints = {
      video: true,
      audio: false,
    };

    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);

    this.videoElement.srcObject = this.videoStream;
    this.videoElement.play();

    this.onEvent("Camera Access is ready");

    return this.videoStream;
  }

  async setupModel() {
    this.onEvent("Load CocoSSD Model");
    this.model = await CocoSSD.load();
    this.onEvent("CocoSSD Model is ready");

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

  async start() {
    this.isActive = true;

    const detect = async () => {
      if (!this.isActive) return;

      const predictions = await this.model!.detect(this.videoElement);

      const { isDetected, people, dogs } =
        this.isPeopleDogsDetected(predictions);

      if (isDetected) {
        this.onDetected(people, dogs);
      }

      console.log(predictions);

      this.draw(people, dogs);

      requestAnimationFrame(() => detect());
    };

    this.videoElement.addEventListener("loadeddata", () => {
      detect();
    });
  }

  draw(people: DetectedObject[], dogs: DetectedObject[]) {
    this.videoElement.parentElement
      ?.querySelectorAll(`[data-class]`)
      .forEach((item) => this.videoElement.parentElement?.removeChild(item));

    [...people, ...dogs].forEach((person) => {
      const div = document.createElement("div");

      div.setAttribute("data-class", person.class);

      div.style.position = "absolute";

      div.style.backgroundColor = "rgba(255, 255, 0, 0.25)";
      div.style.border = "2px solid white";
      div.style.borderRadius = "8px";

      div.style.left = person.bbox[0] + "px";
      div.style.top = person.bbox[1] + "px";

      div.style.width = person.bbox[2] + "px";
      div.style.height = person.bbox[3] + "px";

      this.videoElement.parentElement?.appendChild(div);
    });
  }

  cleanUp() {
    this.videoElement.parentElement
      ?.querySelectorAll(`[data-class]`)
      .forEach((item) => this.videoElement.parentElement?.removeChild(item));
  }

  async stop() {
    this.cleanUp();
    this.isActive = false;

    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
