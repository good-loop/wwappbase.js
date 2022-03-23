import React, { useEffect, useState } from "react";
import DataStore from "../plumbing/DataStore";
import NGO from "../data/NGO";
import { assert } from "../utils/assert";
import BG from "./BG";

/**
 * Displays an image from the NGO. If no NGO is provided, acts as a normal image
 * By default will check which images have already been displayed on the page and choose the next in the list
 * @param {NGO} ngo
 * @param {?Boolean} main use the main photo
 * @param {?Boolean} header use the header photo
 * @param {?Number} imgIdx use a specific image from the image list
 * @param {?Boolean} bg render as a BG component instead
 * @param {?String} src if no NGO is set, will render this like a normal image as a fallback
 */
const NGOImage = ({ngo, main, header, imgIdx, bg, src, ...props}) => {

    assert(ngo || props.src);
    
    const [imageIndex, setImageIndex] = useState(-1);
    const [imgUrl, setImgUrl] = useState();

    const NGO_IMG_PATH = ["widget", "NGOImage", ngo.id, "displayed"];

    useEffect(() => {
        let imagesOnPage = DataStore.getValue(NGO_IMG_PATH);
        if (!imagesOnPage) {
            DataStore.setValue(NGO_IMG_PATH, []);
            imagesOnPage = [];
        }
        const idx = imagesOnPage.length;
        if (idx > ngo.imageList.length - 1) {
            console.warn("There aren't enough NGO images to fill this page!");
            return;
        }
        setImageIndex(idx);
        const url = ngo.imageList[idx].contentUrl;
        setImgUrl(url);
        imagesOnPage.push(url);
        console.log("NGOImage set up with index ", idx, url);
    }, [ngo, main, header, imgIdx]);

    const useUrl = imgUrl || src;

    return bg ? <BG src={useUrl} {...props}/>
        : <img src={useUrl} {...props} />;

};

export default NGOImage;
