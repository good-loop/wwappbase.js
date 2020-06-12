
// Which base URL should we visit to run tests in each context?
const demoServers = {
	local: 'http://localdemo.good-loop.com',
	test: 'https://testdemo.good-loop.com',
	prod: 'https://demo.good-loop.com'
};

const testServers = {
	local: 'http://localtest.good-loop.com',
	test: 'test.good-loop.com',
	prod: 'https://prodtest.good-loop.com'
};

// Which advert should we specify to run tests in each context?
const customVertIds = {
	test: 'FKXON7w1oZ',
	prod: '0PVrD1kX',
	local: 'test_wide_multiple'
};

module.exports = {
	demoServers,
	testServers,
	customVertIds
};
