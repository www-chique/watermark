import { format as datefnsFormat } from "date-fns";

export const dateFormat = (theDate: Date | string, format: string) => {
	return datefnsFormat(new Date(theDate), format);
};
