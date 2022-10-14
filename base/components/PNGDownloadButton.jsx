import React from 'react';
import html2canvas from 'html2canvas';

/**
 * Force the browser to download a data URL.
 * @see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 *
 * @param {string} dataUrl - The Data URL string to be downloaded
 * @param {string} filename - An optional filename - will default to 'image.png' if not set
 */
const saveAs = (dataUrl, fileName) => {
    console.log(`filename: ${fileName}`);
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        link.href = dataUrl;
        link.download = `${fileName}.png`;

        // Firefox requires the link to be in the body
        document.body.appendChild(link);

        link.click();

        // Remove the link when done
        document.body.removeChild(link);
    } else {
        window.open(dataUrl);
    }
}

/**
 * Export an element in the DOM as a png image using html2canvas
 * NB: html2canvas doesn't work well with elements which have a `box-shadow` property.
 * You can remove that using a custom onCloneFn.
 * 
 * @param {string} querySelector - A query selector for the DOM element we want to export
 * @param {string} [fileName="image"] - The filename to use for the exported image
 * @param {function} [onCloneFn] - If an onclone function is specified, a clone of the DOM will be made before
 *                               saving the image. This cloned DOM can be manipulated without affecting the
 *                               original DOM. 
 * @param {object} [opts] - Configuration options to be passed to html2canvas. See: https://html2canvas.hertzen.com/configuration 
 * 
 * @returns a download button
 */
export const PNGDownloadButton = ({querySelector, onCloneFn=()=>void 0, opts={}, fileName="image"}) => {		
    return (
        <a className="png-export" onClick={e => {
            e.preventDefault();
            html2canvas(document.querySelector(querySelector), {
                onclone: (document) => {
                    // Before maniuplating the cloned document, let's hide the download button.
                    // We probably don't ever want to see that.
                    document.querySelectorAll('.png-export').forEach(node => {
                        node.style.display = 'none';
                    });
                    onCloneFn(document);
                }
                    ,
                ...opts
            }).then(canvas => {
                saveAs(canvas.toDataURL(), fileName);
            });
        }}>&#128229; Download</a>
    );
}