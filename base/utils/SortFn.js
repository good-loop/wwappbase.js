/**
 * Handy utilities for sorting
 */

 /**
  * Sort most recent first
  * @param {!Function} dateSelector - Get the date (which can be a string or a number -- anything we can feed into new Date()) from the list item.
  */
const sortByDate = dateSelector => {
	const safeDateSelector = x => {
		try {
			return dateSelector(x) || 0;
		} catch(error) {
			console.warn("dateSelector", x, error);
			return 0;
		}
	};
	return (a,b) => new Date(safeDateSelector(a)).getTime() - new Date(safeDateSelector(b)).getTime();
};

export {
	sortByDate
}
