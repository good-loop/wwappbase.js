import React, { useEffect, useRef, useState } from "react";
import DataStore from "../plumbing/DataStore";
import NGO from "../data/NGO";
import { assert } from "../utils/assert";
import BG from "./BG";

/**
 * Displays an image from the NGO. If no NGO is provided, acts as a normal image
 * CURRENT - imgIdx is required
 * TODO BEHAVIOUR - By default will check which images have already been displayed on the page and choose the next in the list
 * @param {NGO} ngo
 * @param {?Boolean} main use the main photo
 * @param {?Boolean} header use the header photo
 * @param {Number} imgIdx use a specific image from the image list
 * @param {?Boolean} bg render as a BG component instead
 * @param {?String} src if no NGO is set, will render this like a normal image as a fallback (defaults to main photo)
 * @param {?Boolean} noFallback return null instead of falling back
 */
const NGOImage = ({ngo, main, header, imgIdx, bg, src, noFallback, children, ...props}) => {

    assert(ngo || src);
    assert(imgIdx !== undefined || main || header); // temporary
    
    /*

    const [imageIndex, setImageIndex] = useState(-1);
    const [imgUrl, setImgUrl] = useState();
    const [myID, setMyID] = useState(null);

    const NGO_IMG_PATH = ["widget", "NGOImage", ngo.id, "displayed"];

    const domRef = useRef(null);

    const calcPos = () => { return {
        top: domRef.current && domRef.current.getBoundingRect().top + document.documentElement.scrollTop,
        left: domRef.current && domRef.current.getBoundingRect().left + document.documentElement.scrollLeft
    }};

    useEffect(() => {
        let imagesOnPage = DataStore.getValue(NGO_IMG_PATH) || {};
        let id = myId;
        if (!id) {
            id = Date.now();
            setMyID(id);
        }
        imagesOnPage[id] = calcPos();
        DataStore.setValue(NGO_IMG_PATH, imagesOnPage);
    }, [domRef.current, calcPos()]);

    const imagesOnPage = DataStore.getValue(NGO_IMG_PATH) || {};
    if (myID && !imgIdx) {
        let myRank = Object.keys(imagesOnPage).length;
        let myPos = calcPos();
        Object.keys(imagesOnPage).forEach(id => {
            if (id !== myID) {
                if (imagesOnPage[id].top < myPos.top) {
                    myRank --;
                } else if (imagesOnPage[id].top === myPos.top) {
                    if (imagesOnPage[id].left < myPos.left) {
                        myRank --;
                    }
                }
            }
        });
        if (imageIndex !== myRank) setImageIndex(myRank);
        console.log("NGOImage ID", myID, "ranked", myRank);
    }*/


    let idx = imgIdx;//|| imageIndex;

    let useUrl = null;

    // Use main if specified
    if (main && ngo && ngo.images) useUrl = ngo.images;
    // Use header if specified
    else if (header && ngo && ngo.headerImage) useUrl = ngo.headerImage;
    // Use src if image list index is not specified or invalid
    else if (!ngo || !ngo.imageList || idx > ngo.imageList.length - 1 || idx === undefined || !ngo.imageList[idx].contentUrl) {
        if (noFallback) return null;
        useUrl = src || ngo.images;
    } else {
        // Use image index if specified
        useUrl = ngo.imageList[idx].contentUrl;
    }

    const ImgType = bg ? BG : "img";

    if (children && !bg) {
        console.warn("NGOImage set to normal image but given children - will not correctly render!");
    }

    return <ImgType src={useUrl} id={"imageList-" + idx + "-contentUrl"} {...props}>{children}</ImgType>;

};

export default NGOImage;
