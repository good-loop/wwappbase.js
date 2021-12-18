// Copy this file to $YOURHOSTNAME.js and re-run webpack to override constants in ServerIO.
// You don't have to commit it, but it won't affect any other machines if you do.
// The setup below is only an example - you can mix and match servers and hardcode whatever you want.

// Change to "local", "test" or "" to switch all endpoints together
const cluster = 'test';
const protocol = (cluster === 'local') ? 'http' : 'https';

module.exports = {
	ServerIOOverrides: {
    APIBASE: `${protocol}://${cluster}portal.good-loop.com`,
		AS_ENDPOINT: `${protocol}://${cluster}as.good-loop.com`,
		DEMO_ENDPOINT: `${protocol}://${cluster}demo.good-loop.com`,
		DATALOG_ENDPOINT: `${protocol}://${cluster}lg.good-loop.com/data`,
		MEDIA_ENDPOINT: `${protocol}://${cluster}uploads.good-loop.com`,
		ANIM_ENDPOINT: `${protocol}://${cluster}portal.good-loop.com/_anim`,
		CHAT_ENDPOINT: `${protocol}://${cluster}chat.good-loop.com/reply`,
		// DATALOG_DATASPACE: 'gl',
		// ENDPOINT_NGO: 'https://test.sogive.org/charity',
		// JUICE_ENDPOINT: 'https://localjuice.good-loop.com',
		// ADRECORDER_ENDPOINT: 'http://localadrecorder.good-loop.com/record',
	}
};
