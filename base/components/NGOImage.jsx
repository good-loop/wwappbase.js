import React, { useEffect, useRef, useState } from "react";
import DataStore from "../plumbing/DataStore";
import NGO from "../data/NGO";
import { assert } from "../utils/assert";
import BG from "./BG";

/**
 * Displays an image from the NGO. If no NGO is provided, acts as a normal image
 * @param {NGO} ngo
 * @param {?Boolean} main use the main photo
 * @param {?Boolean} header use the header photo
 * @param {Number} imgIdx use a specific image from the image list
 * @param {?Boolean} bg render as a BG component instead
 * @param {?String} src if no NGO is set, will render this like a normal image as a fallback (defaults to main photo). 
 * 	If no src and no NGO, then render null.
 * @param {?JSX} children ??What is the use-case for children of an image??
 */
const NGOImage = ({ngo, main, header, imgIdx, bg, src, children, ...props}) => {
    assert(imgIdx !== undefined || main || header); // temporary

    const ImgType = bg ? BG : "img";
    if (children && !bg) {
        console.warn("NGOImage set to normal image but given children - will not correctly render!");
    }

    let useUrl;
	if (ngo) {
		// Use main if specified
		if (main) useUrl = ngo.images;
		// Use header if specified
		if (header) {
			useUrl = ngo.headerImage;
			if ( ! useUrl) {
				// TODO Hm: could we use a composite image to create a banner effect?
				useUrl = ngo.images;
			}
		}
		if (imgIdx !== null && ngo.imageList && ngo.imageList[imgIdx]) {
			useUrl = ngo.imageList[imgIdx].contentUrl;
		}
	}
	if ( ! useUrl) useUrl = src;
	if ( ! useUrl) return null; // no fallback? then no render

	// ??what is the id used for? Is it for debug purposes??
    return <ImgType src={useUrl} id={"imageList-" + imgIdx + "-contentUrl"} {...props}>{children}</ImgType>;

};

export default NGOImage;
