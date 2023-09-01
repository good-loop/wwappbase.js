export type CSVRow = { [key: string]: string | number | Date };

/**
 * Convert csv File to JavaScript Object
 * @param file
 * @param columnsFilter filter, get only the columns we need
 * @param formatOverride force writing the formart for the whole dataset
 * @param delimiter csv delimter, default to be `,`
 * @returns
 */
export const csvToObject = async (
	file: File,
	columnsFilter: string[] = [],
	formatOverride: string = "",
	delimiter: string = ","
): Promise<CSVRow[]> => {
	const MAX_FILE_SIZE_MB = 10;

	const parseCSV = (rows: string[], headers: string[]) => {
		return rows.map((row) => {
			// CSV Parsing
			const values: string[] = [];
			let cell = "";
			let insideQuotes = false;
			for (let i = 0; i < row.length; i++) {
				const char = row[i];
				if (char === '"') {
					insideQuotes = !insideQuotes;
				} else if (char === delimiter && !insideQuotes) {
					values.push(cell);
					cell = "";
				} else {
					cell += char;
				}
			}
			values.push(cell);

			// To CSVRow[]
			return headers.reduce((object: any, header, index) => {
				if (columnsFilter.length === 0 || columnsFilter.includes(header)) {
					object[header] = values[index];
				}
				if (formatOverride !== "") {
					object["format"] = formatOverride;
				}
				return object;
			}, {});
		});
	};

	return new Promise((resolve, reject) => {
		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			reject(new DOMException("File size too large."));
		}

		const reader = new FileReader();

		reader.onload = () => {
			const fileResult = reader.result as string;
			const lines = fileResult.replaceAll("\r", "").split("\n");
			const headers = lines[0].split(delimiter);
			const rows = lines.slice(1);
			const csvData = parseCSV(rows, headers);

			// console.log("csvData", csvData);
			resolve(csvData);
		};

		reader.onerror = () => {
			reader.abort();
			reject(new DOMException("Problem parsing input file."));
		};

		reader.readAsText(file);
	});
};

/**
 * Download CSV File from a JavaScript Object 
 * @param data 
 */
export const downloadAsCSV = (data: CSVRow[]) => {
	const convertToCSV = (rows: CSVRow[]) => {
		const header = Object.keys(rows[0]).join(",") + "\r\n";
		const body = rows.reduce((csv, row) => {
			csv +=
				Object.values(row)
					.map((value) => {
						if (value instanceof Date) {
							return `"${value.toISOString()}"`;
						}
						return `"${value}"`;
					})
					.join(",") + "\r\n";
			return csv;
		}, "");
		return header + body;
	};

	const csv = convertToCSV(data);
	const blob = new Blob([csv], { type: "text/csv" });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "data.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
