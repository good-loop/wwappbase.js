import React from 'react';
import ServerIO from '../plumbing/ServerIOBase';

class GoodLoopUnit extends React.Component {
    constructor(props) {
        super(props);

        this.adunitRef = null;

		this.setRef = (ref, value) => {
			this[ref] = value;
		};

		this.focusRef = (ref) => {
			if (this[ref]) this[ref].focus();
		};
    }
    
    componentDidMount() {
        this.focusRef('adunitRef');
        const {adunitRef, props: {adID}} = this;
        
        // Load GoodLoop unit in to iframe
        const iframe = document.createElement('iframe');

        const $script = document.createElement('script');
        $script.setAttribute('src', adID ? ServerIO.AS_ENDPOINT + '/unit.js?gl.variant=landscape&gl.vert=' + adID : ServerIO.AS_ENDPOINT + '/unit.js?gl.variant=landscape');

        const $div = document.createElement('div');
        $div.setAttribute('class', 'goodloopad');
        
        iframe.setAttribute('id', 'good-loop-iframe');
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('scrolling', 'auto');
        
        iframe.style.height = 'auto';
        iframe.style.width = 'auto';
        iframe.style['max-width'] = '100%';
    
        iframe.addEventListener('load', () => {
            window.iframe = iframe;
            iframe.contentDocument.body.style.overflow = 'hidden';
            iframe.contentDocument.body.appendChild($script);
            iframe.contentDocument.body.appendChild($div);
        });

        adunitRef.appendChild(iframe);
    }

    render() {
        return <div ref={e => this.setRef('adunitRef', e)} />;
    }
}

module.exports = GoodLoopUnit;
