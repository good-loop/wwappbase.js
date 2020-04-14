
const randomPick = function(array)
{
	if ( ! array) return null;
	let r = Math.floor(array.length*Math.random());
	return array[r];
};

const isMobile = ()  => {		
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	let _isMobile = userAgent.match('/mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i');
	return !! _isMobile;
	// also for small browsers, for debug??
	// return window.innerWidth <= 767;
};

export {
	randomPick,
	isMobile
};
