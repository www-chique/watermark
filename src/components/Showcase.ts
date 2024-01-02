// Imports
import sharp from "sharp";
import { imageResize } from "../utils/imageResize";
import { throwError } from "../utils/throwError";
import to from "await-to-js";

export class Showcase {
	private img: sharp.Sharp;

	constructor({ imageBuffer }: { imageBuffer: Buffer }) {
		this.img = sharp(imageBuffer);
	}

	// Resize image
	public async resizeImage() {
		// Resize image
		const [err, resizedImage] = await to(
			imageResize(await this.img.toBuffer(), {
				maxKb: 1000,
				maxDimensions: [1024, 1024],
			})
		);

		// Save resized image
		if (err) return throwError(err.message);
		this.img = sharp(resizedImage);
	}

	// Watermark image
	private async watermarkImage({
		text,
		width = 160,
		height = 72,
		background = false,
		fontSize = 64,
	}: {
		text: string;
		width?: number;
		height?: number;
		background?: boolean;
		fontSize?: number;
	}) {
		// SVG text
		const svgText = `
		<svg xmlns="http://www.w3.org/2000/svg">
			<text text-anchor="middle" fill="${background ? "#fff" : "#777"}" font-family="Segoe UI" font-size="${fontSize}" x="50%" y="50%" dy="0.25em" opacity="${background ? 1 : 0.4}">
				${text}
			</text>
		</svg>
		`;

		// Convert SVG text to image
		const imageText = await sharp(Buffer.from(svgText)).png().toBuffer();

		// Resize watermark text
		const maxTextWidth = fontSize * 2;
		const maxTextHeight = fontSize;
		const resizedImageText = await sharp(imageText)
			.resize(Math.min(width, maxTextWidth), Math.min(height, maxTextHeight), {
				fit: "inside",
				position: "center",
			})
			.png()
			.toBuffer();

		// Composite watermark text on a blank background
		const watermark = sharp({
			create: {
				width,
				height,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: background ? 0.3 : 0 },
			},
		})
			.composite([
				{
					input: resizedImageText,
					gravity: "center",
				},
			])
			.png()
			.toBuffer();

		// Return watermark
		return watermark;
	}

	// Apply watermark text
	public async applyWatermarkText(text: string) {
		// Get image dimensions
		const { width, height } = await this.img.metadata();
		if (!width || !height) return throwError("Invalid image dimensions");

		// Draw watermark text on image
		this.img = this.img
			// Draw text
			// ?https://sharp.pixelplumbing.com/api-composite#composite
			.composite([
				{
					// Draw watermark image
					input: await this.watermarkImage({
						text,
						background: true,
					}),
					gravity: "southeast",
				},

				// Add watermark images in repeated pattern
				// ?https://sharp.pixelplumbing.com/api-operation#tile
				{
					input: await this.watermarkImage({
						text,
						background: false,
						width: 200,
						height: 200,
					}),
					tile: true,
					gravity: "center",
				},
			]);
	}

	// Get watermarked image
	public async getImage() {
		// Convert buffer to jpeg
		const [err, image] = await to(
			this.img
				.jpeg({
					quality: 95,
				})
				.toBuffer()
		);

		// Return image
		if (err || !image) return throwError(err.message);

		return image;
	}
}
