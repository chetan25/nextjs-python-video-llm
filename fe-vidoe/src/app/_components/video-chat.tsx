"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useMediaRecorder from "@wmik/use-media-recorder";

import { imagesGrid } from "@/app/_utils/utils";
import {
  IMAGE_WIDTH,
  INTERVAL,
  MAX_SCREENSHOTS,
  TRANSPARENT_PIXEL,
} from "@/app/_utils/constants";
import Responses from "@/app/_components/responses";

const enum Phases {
  "IDLE" = "idle",
  "LOADING" = "loading",
  "FINISHED" = "finished",
}

export default function Chat() {
  const [displayDebug, setDisplayDebug] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [phase, setPhase] = useState<Phases>(Phases.IDLE);
  const [base64Img, setBase64Img] = useState<string | null>(null);
  const [imagesGridUrl, setImagesGridUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    { question: string; answer: string; imgData: string }[] | []
  >([]);
  const screenshotsRef = useRef<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  let { liveStream, ...video } = useMediaRecorder({
    recordScreen: false,
    blobOptions: { type: "video/webm" },
    mediaStreamConstraints: { audio: false, video: true },
  });

  function startRecording() {
    video.startRecording();
    setIsStarted(true);
  }

  async function stopRecording() {
    await vidoeRecording();
    video.stopRecording();
    // video.pauseRecording();
    videoRef.current!.srcObject = null;
    setIsStarted(false);
  }

  const vidoeRecording = async () => {
    // Keep only the last XXX screenshots
    screenshotsRef.current = screenshotsRef.current.slice(-MAX_SCREENSHOTS);

    const imageUrl = await imagesGrid({
      base64Images: screenshotsRef.current,
    });

    setBase64Img(imageUrl);
    console.log({ imageUrl });
    setImagesGridUrl(imageUrl);
  };

  useEffect(() => {
    if (videoRef.current && liveStream && !videoRef.current.srcObject) {
      videoRef.current.srcObject = liveStream;
    }
  }, [liveStream]);

  useEffect(() => {
    const captureFrame = () => {
      console.log("Capturing");
      //  && audio.isRecording
      if (video.status === "recording") {
        console.log("recording");
        const targetWidth = IMAGE_WIDTH;

        const videoNode = videoRef.current;
        const canvasNode = canvasRef.current!;

        if (videoNode && canvasNode) {
          const context = canvasNode.getContext("2d")!;
          const originalWidth = videoNode.videoWidth;
          const originalHeight = videoNode.videoHeight;
          const aspectRatio = originalHeight / originalWidth;

          // Set new width while maintaining aspect ratio
          canvasNode.width = targetWidth;
          canvasNode.height = targetWidth * aspectRatio;

          context.drawImage(
            videoNode,
            0,
            0,
            canvasNode.width,
            canvasNode.height
          );
          // Compress and convert image to JPEG format
          const quality = 1; // Adjust the quality as needed, between 0 and 1
          const base64Image = canvasNode.toDataURL("image/jpeg", quality);
          if (base64Image !== "data:,") {
            console.log(screenshotsRef.current.length);
            screenshotsRef.current.push(base64Image);
          }
        }
      }
    };

    const intervalId = setInterval(captureFrame, INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [video.status]);

  const upload = async () => {
    setPhase(Phases.LOADING);
    try {
      const response = await fetch("http://localhost:8888/", {
        method: "POST",
        body: JSON.stringify({ base64Img, question }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setAnswers([
        ...answers,
        {
          question: question!,
          answer: data.message,
          imgData: base64Img!,
        },
      ]);
      console.log({ data });
      setPhase(Phases.FINISHED);
      setQuestion(null);
    } catch (e) {
      console.warn("Error !!!!");
      setPhase(Phases.FINISHED);
    }
  };

  const debug = useCallback((imgData: string) => {
    setImagesGridUrl(imgData);
    setDisplayDebug((p) => !p);
  }, []);

  return (
    <>
      <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        Record and Ask AI
      </h1>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="antialiased w-5/6 h-full p-4 flex flex-col justify-center items-center">
        <div className="w-full h-full sm:container sm:h-auto grid grid-rows-[auto_1fr] grid-cols-[1fr] sm:grid-cols-[1fr_1fr] sm:grid-rows-[1fr] justify-content-center ">
          <div className="relative" id="video">
            <video
              ref={videoRef}
              className="h-auto w-full aspect-[4/3] object-cover rounded-[1rem] bg-gray-900"
              autoPlay
            />
            <div className=" w-5/6">
              <div className="flex flex-wrap justify-center p-4 gap-2">
                {isStarted ? (
                  <button
                    className="px-4 py-2 bg-red-800 rounded-md disabled:opacity-50"
                    onClick={stopRecording}
                  >
                    Pause session
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-blue-800 rounded-md disabled:opacity-50"
                    onClick={startRecording}
                  >
                    Start session
                  </button>
                )}
                <button
                  disabled={!base64Img}
                  className="px-4 py-2 bg-orange-800 rounded-md disabled:opacity-50"
                  onClick={() => {
                    debug(base64Img!);
                  }}
                >
                  Debug
                </button>
              </div>
              <div className="flex flex-wrap justify-center p-4 gap-2">
                <input
                  className="px-4 py-2 rounded-md w-2/3"
                  value={question || ""}
                  placeholder="Start Session and enter your question"
                  onChange={(e) => setQuestion(e.target.value)}
                />

                <button
                  type="button"
                  disabled={!question || !base64Img}
                  className="px-4 py-2 bg-green-800 rounded-md disabled:opacity-50"
                  onClick={async () => {
                    upload();
                  }}
                >
                  Ask AI
                </button>
              </div>
            </div>
          </div>
          <Responses answers={answers} debug={debug} />
          {phase == Phases.LOADING && (
            <div className="flex p-12 text-md leading-relaxed relative items-center justify-center ">
              <div className="absolute left-50 top-50 w-8 h-8 ">
                <div className="w-6 h-6 -mr-3 -mt-3 rounded-full bg-cyan-500 animate-ping" />
              </div>
            </div>
          )}
        </div>
      </div>
      {displayDebug ? (
        <div
          className={`bg-[rgba(20,20,20,0.8)] backdrop-blur-xl p-8 rounded-sm absolute left-0 top-0 bottom-0 transition-all w-[75vw] sm:w-[33vw] ${
            displayDebug ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className="absolute z-10 top-4 right-4 opacity-50 cursor-pointer"
            onClick={() => setDisplayDebug(false)}
          >
            ⛌
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="font-semibold opacity-50">Captures:</div>
              <img
                className="object-contain w-full border border-gray-500"
                alt="Grid"
                src={imagesGridUrl || TRANSPARENT_PIXEL}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
