// Imports
import * as jetpack from "fs-jetpack";
import { throwError } from "./throwError";
import to from "await-to-js";
import sharp from "sharp";

// Image path can be local or URL
export const getImageBuffer = async (imagePath: string) => {
	// Download or load image
	const isUrl = imagePath.startsWith("http://") || imagePath.startsWith("https://");
	if (isUrl) {
		return throwError("URL not supported yet");
	}

	const imgBuffer = await getImageFromLocal(imagePath);

	// Check if valid image
	const img = sharp(imgBuffer);
	const { width, height } = await img.metadata();
	if (!width || !height) {
		return throwError("Invalid image");
	}
	console.info(`🎨 Image dimensions: ${width}x${height}`);

	return imgBuffer;
};

const getImageFromLocal = async (imagePath: string) => {
	// Check if valid image path
	const [err, exists] = await to(jetpack.existsAsync(imagePath));
	if (err || !exists) {
		return throwError("Invalid image path");
	}

	// Read image
	const [readErr, imgBuffer] = await to(jetpack.readAsync(imagePath, "buffer"));
	if (readErr || !imgBuffer) {
		return throwError("Invalid image");
	}

	return imgBuffer;
};
