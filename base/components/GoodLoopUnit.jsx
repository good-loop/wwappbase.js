import React from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import { assert } from 'sjtest';

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
        
        // Reference to iframe containing GoodLoop unit
        const iframe = document.createElement('iframe');

        this.state = { iframe };
    }
    
    // Should only have to re-insert the adunit when a different variant is needed
    componentDidMount() {
        this.focusRef('adunitRef');
        const {adunitRef} = this;
        const { adID, CSS } = this.props;
        const { iframe } = this.state;

        const $script = document.createElement('script');
        $script.async = true;
        $script.setAttribute('src', adID ? ServerIO.AS_ENDPOINT + '/unit.js?gl.size=landscape&gl.vert=' + adID : ServerIO.AS_ENDPOINT + '/unit.js');

        const $container = document.createElement('div');
        $container.id = "unit-container"

        const $noFrameMarker = document.createElement('div');
        $noFrameMarker.id = "glNoFrameMarker";
        
        const $link = document.createElement('link');
        $link.type = 'text/css';
        $link.rel = 'stylesheet';
        $link.href =  ServerIO.AS_ENDPOINT + '/unit.css';

        iframe.setAttribute('id', 'good-loop-iframe');
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('scrolling', 'auto');
        
        iframe.style.height = '360px';
        iframe.style.width = '640px';
        // iframe.style['max-width'] = '100%';
    
        iframe.addEventListener('load', () => {
            window.iframe = iframe;
            iframe.contentDocument.body.style.overflow = 'hidden';
            iframe.contentDocument.body.appendChild($script);
            iframe.contentDocument.body.appendChild($container);
            iframe.contentDocument.body.appendChild($noFrameMarker);
            iframe.contentDocument.head.appendChild($link);
        });

        $script.addEventListener('load', () => {
            // Insert CSS provided by prop in to unit
            insertAdunitCSS({ iframe, CSS })
        });

        adunitRef.appendChild(iframe);
    }

    componentWillUpdate(nextProps, nextState) {
        const { CSS: nextCSS } = nextProps;
        const { CSS } = this.props;
        const { iframe } = this.state;

        // Do not execute if iframe hasn't loaded yet
        if( nextCSS !== CSS ) {
            insertAdunitCSS({ iframe, CSS: nextCSS });
        }

        this.props = nextProps;
        this.state = nextState;
    }

    render() {
        return <div ref={e => this.setRef('adunitRef', e)} />;
    }
}

// For custom CSS. Used by MockUpGenerator to preview changes on the fly.
const insertAdunitCSS = ({ iframe, CSS }) => {
    if( !CSS ) return;
    assMatch(CSS, 'String');

    const $style = document.createElement('style');
    $style.type = 'text/css';
    $style.id = 'vert-css';
    $style.innerHTML = CSS;

    // Has the adunit already inserted a custom CSS tag?
    // If so, delete it. Use querySelectorAll in case multiple tags were accidentaly inserted
    // TODO: (14/02/19) attempt to fix this bug. Appears that GoodLoop scripts are executing after CSS has already been inserted
    // Means that there will be two identical CSS script tags in the DOM. Ignoring this for now as it doesn't really matter.
    const $adunitCSS = iframe.contentDocument.querySelectorAll('#vert-css');
    if( $adunitCSS ) {
        $adunitCSS.forEach( node => node.parentElement.removeChild(node) );
    } 
    iframe.contentDocument.head.appendChild($style);
};

module.exports = GoodLoopUnit;
