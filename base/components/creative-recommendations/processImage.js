import { RECS_OPTIONS_PATH } from '../../../components/pages/greendash/GreenRecsCreative';
import DataStore from '../../plumbing/DataStore';
import { callRecompressServlet, processLocal } from './processGeneric';


/**
 * Determine the optimal size for an image based on its inherent size, element size, and CSS sizing rules.
 * @param {Image} img A HTMLImageElement
 * @param {object} elInfo
 * @param {Number} elInfo.width On-screen width of the element
 * @param {Number} elInfo.height On-screen height of the element
 * @param {object} elInfo.css CSS rules relevant to image display & sizing, eg object-fit, background-size, background(-image)
 */
function optImgSize(img, elInfo) {
	const { width, height } = elInfo;
	const nativeAspect = img.naturalWidth / img.naturalHeight;
	// Don't scale if the dimensions would be smaller or very close to the original - arbitrary cutoff 5%
	if ((width / img.naturalWidth) < 1.05 || (height / img.naturalHeight) < 1.05) {
		return { width: img.naturalWidth, height: img.naturalHeight };
	}
	let newSize = { width, height }; // Default target dimensions = container size

	// TODO Currently assuming object-fit/background-size: contain - should check & account for cover, stretch, percentage
	// TODO crop as well
	if (width / height > nativeAspect) {
		newSize.width = height * nativeAspect; // container wider than image --> container height determines size
	} else {
		newSize.height = width / nativeAspect; // container taller than image --> container width determines size
	}
	return { width, height };
}


/**
 * Create a HTMLImageElement & return a promise which resolves when the image is loaded.
 * @param {string} url URL of the image to load
 */
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener('load', () => resolve(img));
		img.addEventListener('error', err => reject(err));
		img.src = url;
	});
}


/**
 * Iterate through all elements an image is found in & find the one where it displays at the largest size.
 * @param {HTMLImageElement} img
 * @param {object[]} elements
 */
function findMaxSize(img, elements) {
	// What's the biggest size it displays at? Estimate rendered size in each element the image is found in.
	return elements.reduce((acc, el) => {
		const thisSize = optImgSize(img, el);
		if (thisSize.width > acc.width) return thisSize; // optImgSize maintains aspect ratio so don't need to check both
		return acc;
	}, {width: 0, height: 0});
}


/**
 * Call RecompressServlet to attempt to optimise an image
 * @param {object} transfer One Transfer object from a PageManifest
 * @param {object} size Target width and height for resize
 */
function recompress(transfer, {width, height}) {
	if (!width || !height) {
		// Either no elements were found which contained the image, or it was rendered at height/width 0.
		// Mark as "possibly unused"
		return processLocal(transfer, 'image', { unused: true });
	}

	// Get options
	const { noWebp = false, retinaMultiplier = 1} = DataStore.getValue(RECS_OPTIONS_PATH);

	// Apply 1x / 1.5x / 2x multiplier before coercing size to integer
	width = Math.floor(retinaMultiplier * width);
	height = Math.floor(retinaMultiplier * height);

	return callRecompressServlet(transfer, 'image', { width, height, noWebp });
}


function processImage(transfer) {
	const { url, elements = [] } = transfer;
	
	// Ignore tiny images like tracking pixels and interface buttons
	if (transfer.bytes < 3000) {
		const { url: optUrl, bytes: optBytes } = transfer;
		return processLocal(transfer, 'image', { optUrl, optBytes, message: `Ignoring tiny image (${transfer.bytes} bytes)`, noop: true });
	};

	return loadImage(url).then(imgEl => {
		// nested promises so we can retain the HTMLImageElement and attach it to the augmented transfer
		let size = findMaxSize(imgEl, elements);
		return recompress(transfer, size)
		.then(augTransfer => ({...augTransfer, imgEl}));
	})
}


export default processImage;
