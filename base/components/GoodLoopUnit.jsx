import React from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import { assert } from 'sjtest';

const injectGoodLoopUnit = ({ adID, CSS, adunitRef, iframe, size }) => {
    // Important that this is not falsy
    if( !size ) size = 'landscape';

    // GoodLoop unit script
    const $script = document.createElement('script');
    $script.async = true;
    let src = ServerIO.AS_ENDPOINT + '/unit.js?gl.size=' + size + '&';
    if ( adID ) src += ('gl.vert=' + adID + '&');
    $script.setAttribute('src', src);

    // Prevent adunit from wrapping itself in its own (cross-domain) iframe
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
    
    // Set appopriate height and width for gl.size selected
    if ( size === 'landscape') {
        iframe.style.height = '360px';
        iframe.style.width = '640px';
    } else if ( size === 'portrait' ) {
        iframe.style.height = '800px';
        iframe.style.width = '450px';
    }

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
};

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
    
    componentDidMount() {
        this.focusRef('adunitRef');
        const { adunitRef } = this;
        const { iframe } = this.state;

        injectGoodLoopUnit({ ...this.props, adunitRef, iframe });
    }

    componentWillUpdate(nextProps, nextState) {
        const { CSS: nextCSS, size: nextSize } = nextProps;
        const { CSS, size } = this.props;
        const { iframe } = this.state;
        this.props = nextProps;
        this.state = nextState;

        // Reload the adunit
        if ( nextSize !== size ) {
            const { adunitRef } = this;

            // Delete current iframe from DOM
            iframe.parentElement.removeChild(iframe);
            
            // Create new iframe, fill with adunit, then insert
            const nextIframe = document.createElement('iframe');
            injectGoodLoopUnit( {...nextProps, iframe: nextIframe, adunitRef } );
            // Update iframe reference in state
            this.setState({ iframe: nextIframe });
            return;
        }

        // No need to reload, just replace CSS in head
        if( nextCSS !== CSS ) {
            insertAdunitCSS({ iframe, CSS: nextCSS });
            return;
        }
    }

    render() {
        return <div ref={e => this.setRef('adunitRef', e)} />;
    }
}

module.exports = GoodLoopUnit;
