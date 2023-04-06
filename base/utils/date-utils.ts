/**
 * Collect adhoc date processing in one place to avoid repeatedly reinventing the wheel
 * 
 * TODO lets find a nice library that provides much of what we need.
 */

import { getUrlVars } from "./miscutils";


/**
 * 0 = Sunday
 */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortWeekdays = WEEKDAYS.map(weekday => weekday.substr(0, 3));
export const WEEKDAYS_FROM_MONDAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortMonths = MONTHS.map(month => month.substr(0, 3));

/**
 * Pad under 10 with "0". Especially useful with dates.
 * @param {Number} n 
 * @returns {String} e.g. "03"
 */
export const oh = (n:number) => n<10? '0'+n : n;


/**
 * Make sure it's a Date not a String
 * @param {?String|Date} s falsy returns null
 * @returns {?Date}
 */
export const asDate = (s: Date|String) : Date|null => {
	if (!s) return null;
	if (typeof s === 'string') return new Date(s);
	return s as Date;
};

/**
 * @param {?Date|String} d
 * @return {?String} iso format (date only, no time-of-day part) e.g. 2020-10-18
 */
export const isoDate = (d: Date|String) => d? asDate(d).toISOString().replace(/T.+/, '') : null;

/**
 * Locale-independent
 * @param {!Date} d 
 * @returns {!string} e.g "13 Mar 2023"
 */
export const dateStr = (d: Date) => `${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`;


/** Locale-independent date (without year) to string, formatted like "25 Apr" */
export const printDateShort = (date : Date) => {
	let ds = dateStr(date);
	return ds.substring(0, ds.length-5);
};


/**
 * Human-readable, unambiguous date+time string which doesn't depend on toLocaleString support
 */
export const dateTimeString = (d) => (
	`${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()} ${oh(d.getHours())}:${oh(d.getMinutes())}`
);




// FROM dashutils


export type Period = {start:Date, end:Date, name:String|null};

/**
 * ??timezone handling??
 * 
 * Returns a period object for the quarter enclosing the given date
 * @param {?Date} date Default "now"
 * @returns {start, end, name}
 */
export const getPeriodQuarter = (date = new Date()) => {
	const qIndex = Math.floor(date.getMonth() / 3);
	const start = new Date(date);
	start.setMonth(qIndex * 3, 1);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setMonth(end.getMonth() + 3);
	return {start, end, name: `${start.getFullYear()}-Q${qIndex + 1}`};
};


/**
 * ??timezone handling??
 * Returns a period object for the month enclosing the given date
 * @param {?Date} date 
 * @returns {Period}
 */
export const getPeriodMonth = (date = new Date()) : Period => {
	const start = new Date(date)
	start.setDate(1);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setMonth(end.getMonth() + 1);
	return {start, end, name: `${start.getFullYear()}-${end.getMonth()}`};
};


export const getPeriodYear = (date = new Date()) => {
	const start = new Date(date);
	start.setMonth(0, 1);
	start.setHours(0, 0, 0, 0);
	const end = new Date(date)
	end.setMonth(12);
	return {start, end, name: `${start.getFullYear()}`};
};

interface UrlParamPeriod extends Object {
	start?: string,
	end?: string, 
	period?: string
}

/**
 * Read period (name) or start/end
 * @param {Object} urlParams If unset use getUrlVars()
 */
export const getPeriodFromUrlParams = (urlParams: UrlParamPeriod | null) : Period|null => {
	if ( ! urlParams) urlParams = getUrlVars(null, null);
	let {start, end, period} = urlParams;
	const periodObjFromName = periodFromName(period);
	// User has set a named period (year, quarter, month)
	if (periodObjFromName) {		
		return periodObjFromName;
	}

	// Custom period with start/end values
	if (start || end) {
		const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
		const periodFromStartEnd = {} as Period;
		if (start) {			
			periodFromStartEnd.start = asDate(start)!;
		}
		if (end) {
			if (dateFormat.test(end)) {
				end = end + `T23:59:59Z` // Our endpoint does not support 59.999Z
			}
			periodFromStartEnd.end = asDate(end)!;
		}
			// const [, yyyy, mm, dd] = end.match(/(\d+)-(\d+)-(\d+)/) as any[];
			// period.end = new Date(yyyy, mm, dd);
			// period.end.setMonth(period.end.getMonth() - 1); // correct for Date taking zero-index months
			// // Intuitive form "Period ending 2022-03-31" --> machine form "Period ending 2022-04-01T00:00:00"
			// period.end.setDate(period.end.getDate() + 1);		
		return periodFromStartEnd;
	}
	return null;
};

/** Convert a name to a period object
 * @returns {?Period}
*/
export const periodFromName = (periodName?:string) : Period|null  => {
	if ( !periodName) {
		return null;
	}
	if (periodName === 'all') {
		return {
			start: new Date('1970-01-01'),
			end: new Date('3000-01-01'),
			name: 'all'
		}
	}
	let refDate = new Date();
	
	// eg "2022-Q2"
	const quarterMatches = periodName.match(quarterRegex);
	if (quarterMatches) {
		refDate.setFullYear(quarterMatches[1]);
		refDate.setMonth(3 * (quarterMatches[2] - 1));
		return getPeriodQuarter(refDate);
	}
	// eg "2022-04"
	const monthMatches = periodName.match(monthRegex);
	if (monthMatches) {
		refDate.setFullYear(monthMatches[1]);
		refDate.setMonth(monthMatches[2]);
		return getPeriodMonth(refDate);
	}
	// eg "2022"
	const yearMatches = periodName.match(yearRegex);
	if (yearMatches) {
		refDate.setFullYear(yearMatches[1]);
		return getPeriodYear(refDate)
	}
	throw new Error("Unrecognised period "+periodName);
};


/** Take a period object and transform it to use as URL params */
export const periodToParams = ({name, start, end}) : Period => {
	const newVals = {} as Period;
	if (name) {
		newVals.period = name;
	} else {
		// Custom period - remove period name from URL params and set start/end
		if (start) newVals.start = asDate(start).toISOString();
		if (end) {
			// url params don't have to be pretty (push prettiness up to rendering code)
			newVals.end = asDate(end).toISOString();
			// // Machine form "Period ending 2022-04-01T00:00:00" --> intuitive form "Period ending 2022-03-31"
			// end = new Date(end);
			// end.setDate(end.getDate() - 1);
			// newVals.end = isoDate(end);
		}
	}
	return newVals;
}

const quarterNames = [, '1st', '2nd', '3rd', '4th'];


/**
 * Turn period object into clear human-readable text
 * @param {Period} period Period object with either a name or at least one of start/end
 * @param {?Boolean} short True for condensed format
 * @returns 
 */
export const printPeriod = ({start, end, name}:Period, short=false) => {
	if (name) {
		if (name === 'all') return 'All Time';

		// Is it a named period (quarter, month, year)?
		const quarterMatches = name.match(quarterRegex);
		if (quarterMatches) {
			const [, year, num] = quarterMatches;
			if (short) return `Q${num} ${year}`; // eg "Q1 2022"
			return `${year} ${quarterNames[num]} quarter`; // eg "2022 1st Quarter"
		}

		const monthMatches = name.match(monthRegex);
		if (monthMatches) {
			const [, month, year] = monthMatches;
			return `${shortMonths[month]} ${year}`; // eg "Jan 2022"
		}

		const yearMatches = name.match(yearRegex);
		if (yearMatches) {
			const [, year] = yearMatches;
			if (short) return `${year}`; // eg "2022"
			return `Year ${year}`; // eg "Year 2022"
		}
	}

	// Bump end date back by 1 second so eg 2022-03-01T00:00:00.000+0100 to 2022-04-01T00:00:00.000+0100
	// gets printed as "1 March 2022 to 31 March 2022"
	end = new Date(end);
	end.setSeconds(end.getSeconds() - 1);

	const pd = short ? printDateShort : dateStr;
	return `${start ? pd(start) : ``} to ${end ? pd(end) : `now`}`;
};

// export const periodKey = ({start, end, name}) : String => {
// 	if (name) return name;
// 	return `${start ? isoDate(start) : 'forever'}-to-${end ? isoDate(end) : 'now'}`
// };

const quarterRegex = /^(\d\d?\d?\d?)-Q(\d)$/;
const monthRegex = /^(\d\d?\d?\d?)-(\d\d?)$/;
const yearRegex = /^(\d\d?\d?\d?)$/;

