import * as jetpack from "fs-jetpack";
import toml from "toml";

export const getConfig = <T>(fileName: string) => {
	// Parse the config
	const fileContents = jetpack.read(fileName, "utf8");
	if (!fileContents) {
		console.error("🚫 file not found!", fileName);
		process.exit(1);
	}
	return toml.parse(fileContents) as T;
};
