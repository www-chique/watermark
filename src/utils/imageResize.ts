// Imports
import sharp from "sharp";

// Base64 image resize
const MAX_COMPRESS_ITERATION = 3;
export type TCompressionOptions = {
	maxKb?: number;
	resize?: number | [number, number | undefined] | [undefined, number];
	maxDimensions?: [number, number];
	iteration?: number;
	startQuality?: number;
};
export const imageResize = async (imgBuffer: Buffer, { maxKb, resize, maxDimensions, iteration = 1, startQuality = 95 }: TCompressionOptions = {}) => {
	let img = sharp(imgBuffer);

	// If orientation is not default, then rotate.
	// ?This is needed to fix iPhone's portrait images rotating 90 degrees with EXIF data
	const { orientation } = await img.metadata();
	if (orientation && orientation !== 1) {
		img = img.rotate(); // Auto-rotate based on EXIF data
		img = sharp(await img.toBuffer()); // Without buffer conversion, the rotation will not take effect
	}

	// Original dimensions
	let widthOriginal: number | undefined;
	let heightOriginal: number | undefined;
	const getOriginalDimensions = async () => {
		if (!!widthOriginal && !!heightOriginal) return;
		const { width, height } = await img.metadata();
		widthOriginal = width;
		heightOriginal = height;
	};

	// Resize
	let widthResize: number | undefined;
	let heightResize: number | undefined;
	if (!!resize) {
		// If resize is defined
		if (!Array.isArray(resize)) {
			widthResize = resize;
			heightResize = resize;
		} else {
			if (!!resize[0] && !!resize[1]) {
				// If both values are defined
				widthResize = resize[0];
				heightResize = resize[1];
			} else {
				// if any one of the value is undefined, so need to infer the other value based on aspect ratio

				// Get original image dimensions
				if (!widthOriginal || !heightOriginal) {
					await getOriginalDimensions();
				}

				// Maintain aspect ratio
				if (widthOriginal && heightOriginal) {
					widthResize = resize[0] ?? widthOriginal;
					heightResize = resize[1] ?? heightOriginal;

					// Calculate based on aspect ratio
					if (resize[0] === undefined) {
						widthResize = Math.floor((widthOriginal * resize[1]) / heightOriginal);
					} else if (resize[1] === undefined) {
						heightResize = Math.floor((heightOriginal * resize[0]) / widthOriginal);
					}
				}
			}
		}
	}
	if (!!maxDimensions) {
		if (!Array.isArray(maxDimensions)) {
			maxDimensions = [maxDimensions, maxDimensions];
		}

		// Get original image dimensions
		if (!widthOriginal || !heightOriginal) {
			await getOriginalDimensions();
		}

		// If any of the dimensions is undefined, set it to original
		widthResize ??= widthOriginal;
		heightResize ??= heightOriginal;

		// If any of the dimensions is greater than max, resize to fit while maintaining aspect ratio
		if (widthResize && heightResize && widthOriginal && heightOriginal) {
			if (widthResize > maxDimensions[0]) {
				widthResize = maxDimensions[0];
				heightResize = Math.floor((heightOriginal * widthResize) / widthOriginal);
			}

			if (heightResize > maxDimensions[1]) {
				heightResize = maxDimensions[1];
				widthResize = Math.floor((widthOriginal * heightResize) / heightOriginal);
			}
		}
	}
	if (!!widthResize && !!heightResize) {
		// *Finally, resize image
		img = img.resize(widthResize, heightResize);
	}

	// Conversion to WebP
	const quality = startQuality - 10 * (iteration - 1);
	img = img.webp({
		quality: Math.max(quality, 50), //Incremental compression, but minimum 50%
	});
	let outputBuffer = await img.toBuffer();

	// *If still size is greater than required, compress again
	if (!!maxKb) {
		const compressedSizeKb = Buffer.byteLength(outputBuffer) / 1024;
		if (iteration < MAX_COMPRESS_ITERATION && compressedSizeKb > maxKb) {
			outputBuffer = await imageResize(outputBuffer, { maxKb, iteration: iteration + 1 });
		}
	}

	return outputBuffer;
};
