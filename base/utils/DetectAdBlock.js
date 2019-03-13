import DataStore from '../plumbing/DataStore';

/** Will set DataStore flag if the user has adblock enabled */
const DetectAdBlock = ({path}) => {
    const $script = document.createElement('script');
    // Based on https://www.detectadblock.com/
    // Adblockers are expected to always block js files with "ads" in the name
    $script.setAttribute('src', 'https://as.good-loop.com/ads.js');
    
    $script.onload = () => {
        // If adblocker enabled, ads.js will not be able to create div with id #aiPai9th 
        const adBlockEnabled = ! document.getElementById('aiPai9th');
        DataStore.setValue(path, adBlockEnabled);
    };

    $script.onerror = () => {
        DataStore.setValue(path, true);
    };

    document.head.appendChild($script);
};

export default DetectAdBlock;
