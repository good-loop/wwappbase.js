
const randomPick = function<T>(array : T[]) : T
{
	if ( ! array) return null;
	let r = Math.floor(array.length*Math.random());
	return array[r];
};

const sum = (array : Number[]) : Number => array.reduce((acc, a) => acc + a, 0);

const isMobile = ()  => {		
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	let _isMobile = userAgent.match('/mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i');
	return !! _isMobile;
};

/**  */
const isPortraitMobile = () => window.matchMedia("only screen and (max-width: 768px)").matches && window.matchMedia("(orientation: portrait)").matches;

// DEBUG hack
window.miscutils = {
	randomPick,
	sum,
	isMobile,
	isPortraitMobile
};

export {
	randomPick,
	sum,
	isMobile,
	isPortraitMobile
};
