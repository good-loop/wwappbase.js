

const randomPick = function(array)
{
	if ( ! array) return null;
	let r = Math.floor(array.length*Math.random());
	return array[r];
};

const isMobile = ()  => {
	return window.innerWidth <= 767;
};

export {
	randomPick,
	isMobile
};
