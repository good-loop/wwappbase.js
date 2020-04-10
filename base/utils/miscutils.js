

const randomPick = function(array)
{
	if ( ! array) return null;
	let r = Math.floor(array.length*Math.random());
	return array[r];
};

export {
	randomPick
};
