import React from "react";
import MDText from "./MDText";
import { assert } from "../utils/assert";


/**
 * Display a charity description
 * @param {NGO} ngo
 * @param {?Bool} summarize use the summary description
 * @param {?Bool} extended use the extended description
 * @returns 
 */
const NGODescription = ({ngo, summarize, extended}) => {
    
    assert(ngo.id, ngo);

    let desc;
    if (summarize) desc = ngo.summaryDescription || ngo.description || ngo.extendedDescription;
    else if (extended) desc = ngo.extendedDescription || ngo.description || ngo.summaryDescription;
    else desc = ngo.description || ngo.summaryDescription || ngo.extendedDescription;

    return <MDText source={desc}/>;

};

export default NGODescription;
