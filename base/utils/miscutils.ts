
const randomPick = function<T>(array : T[]) : T
{
	if ( ! array) return null;
	let r = Math.floor(array.length*Math.random());
	return array[r];
};

const isMobile = ()  => {		
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	let _isMobile = userAgent.match('/mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i');
	return !! _isMobile;
};

export {
	randomPick,
	isMobile
};
