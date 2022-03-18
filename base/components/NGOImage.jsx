import React, { useEffect } from "react";
import DataStore from "../plumbing/DataStore";
import NGO from "../data/NGO";
import { assert } from "../utils/assert";

/**
 * Displays an image from the NGO.
 * By default will check which images have already been displayed on the page and choose the next in the list
 * @param {NGO} ngo
 * @param {?Boolean} main use the main photo
 * @param {?Boolean} header use the header photo
 * @param {?Number} imgIdx use a specific image from the image list
 */
const NGOImage = ({ngo, main, header, imgIdx}) => {

    assert(ngo.id, ngo);

    const NGO_IMG_PATH = ["widget", "NGOImage", ngo.id, "displayed"];

    useEffect(() => {
        let imagesOnPage = DataStore.getValue(NGO_IMG_PATH);
        if (!imagesOnPage) {
            DataStore.setValue(NGO_IMG_PATH, []);
            imagesOnPage = [];
        }
        
    }, [ngo, main, header, imgIdx]);

};

export default NGOImage;
