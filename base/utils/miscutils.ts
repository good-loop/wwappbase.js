import Messaging from "../plumbing/Messaging";

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


/**
 * 
 */
const doShare = ({href,title,text}) => {
	if ( ! navigator.share) {
		console.warn("No share function");
		
		Messaging.notifyUser("Sharing link copied to clipboard");
		return;
	}
	navigator.share({url:href,title,text});
};

function fallbackCopyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;
	
	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";
  
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
  
	try {
	  var successful = document.execCommand('copy');
	  var msg = successful ? 'successful' : 'unsuccessful';
	  console.log('Fallback: Copying text command was ' + msg);
	} catch (err) {
	  console.error('Fallback: Oops, unable to copy', err);
	}
  
	document.body.removeChild(textArea);
  }
  function copyTextToClipboard(text) {
	if (!navigator.clipboard) {
	  fallbackCopyTextToClipboard(text);
	  return;
	}
	navigator.clipboard.writeText(text).then(function() {
	  console.log('Async: Copying to clipboard was successful!');
	}, function(err) {
	  console.error('Async: Could not copy text: ', err);
	});
  }

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
	isPortraitMobile,
	doShare
};
