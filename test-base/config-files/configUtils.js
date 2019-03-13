function generateEndpointURL(serviceBaseURL) {
    // Expect this to be placed in env by jest.sh
    const serverType = process.env.TEST_SERVER_TYPE;
    
    if( serverType === 'local') return 'http://local'+serviceBaseURL;
    if( serverType === 'test') return 'https://test'+serviceBaseURL;
  
    return serviceBaseURL === '.sogive.org' ? 'https://app.sogive.org' : 'https://' + serviceBaseURL;
}

module.exports = {
    generateEndpointURL
};
