import to from "await-to-js";
import { Showcase } from "./components/Showcase";
import { getConfig } from "./config/getConfig";
import { getImageBuffer } from "./utils/getImageBuffer";
import * as jetpack from "fs-jetpack";
import { throwError } from "./utils/throwError";

// Constants
const ENV_FILE = "./.env.toml";
const config = getConfig<{
	BRAND: string;
}>(ENV_FILE);
const BRAND = config.BRAND;

// Main
const main = async () => {
	// Get image path from command line arguments
	const imagePath = process.argv[2];
	if (!imagePath) {
		return throwError("Image path is required");
	}

	// Image buffer
	const imgBuffer = await getImageBuffer(imagePath);

	// Watermark text
	const showcase = new Showcase({ imageBuffer: imgBuffer });
	await showcase.resizeImage();
	console.info("✅ Resized image");
	await showcase.applyWatermarkText(BRAND);
	console.info("✅ Watermarked image");

	// Save image
	const imageSavePath = imagePath.replace(/(\.[a-z]+)$/i, `__thumb$1`);
	console.info(`💾 Saving at: ${imageSavePath}`);
	const thumbnailBuffer = await showcase.getImage();
	const [err] = await to(jetpack.writeAsync(imageSavePath, thumbnailBuffer));

	// Error
	if (err) {
		return throwError(err.message);
	}

	// Success
	console.info("✅ Done");
};

// Run main
main();
