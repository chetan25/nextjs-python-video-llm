import mergeImages from "merge-images";
import {
  COLUMNS,
  IMAGE_QUALITY,
  IMAGE_WIDTH,
  TRANSPARENT_PIXEL,
} from "./constants";

export const getImageDimensions = async (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();

    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = function () {
      reject(new Error("Failed to load image."));
    };

    img.src = src;
  });
};

export async function imagesGrid({
  base64Images,
  columns = COLUMNS,
  gridImageWidth = IMAGE_WIDTH,
  quality = IMAGE_QUALITY,
}: {
  base64Images: string[];
  columns?: number;
  gridImageWidth?: number;
  quality?: number;
}) {
  if (!base64Images.length) {
    return TRANSPARENT_PIXEL;
  }

  const dimensions: any = await getImageDimensions(base64Images[0]);

  // Calculate the aspect ratio of the first image
  const aspectRatio = dimensions.width / dimensions.height;

  const gridImageHeight = gridImageWidth / aspectRatio;

  const rows = Math.ceil(base64Images.length / columns); // Number of rows

  // Prepare the images for merging
  const imagesWithCoordinates = base64Images.map((src, index) => ({
    src,
    x: (index % columns) * gridImageWidth,
    y: Math.floor(index / columns) * gridImageHeight,
  }));

  // Merge images into a single base64 string
  return await mergeImages(imagesWithCoordinates, {
    format: "image/jpeg",
    quality,
    width: columns * gridImageWidth,
    height: rows * gridImageHeight,
  });
}
