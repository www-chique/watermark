// Throw error
export const throwError = (message: string) => {
	console.error("❌", message);
	process.exit(1);
};
