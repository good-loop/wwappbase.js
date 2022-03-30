/** Data model functions for the Advert data-type. */
import { assert, assMatch } from '../utils/assert';
import Enum from 'easy-enums';
import DataClass from './DataClass';
import C from '../CBase';
import ActionMan from '../plumbing/ActionManBase';
import SearchQuery from '../../base/searchquery';
import List from './List';
import DataStore, { getDataPath } from '../plumbing/DataStore';
import deepCopy from '../utils/deepCopy';
import { getDataItem, saveEdits } from '../plumbing/Crud';
import PromiseValue from 'promise-value';
import KStatus from './KStatus';
import Advert from './Advert';
import ServerIO, {normaliseSogiveId} from '../plumbing/ServerIOBase';
import { is, keysetObjToArray, uniq, uniqById, yessy, mapkv, idList, sum, getUrlVars, asDate } from '../utils/miscutils';
import { getId } from './DataClass';
import NGO from './NGO';
import Money from './Money';

/**
 * NB: in shared base, cos Portal and ImpactHub use this
 * 
 * See Campaign.java
 */
class BlogPost extends DataClass {
	
	/** @type{String} */
	title;

	/** @type{String} */
	subtitle;

	/** @type{String} */
	content;

	/** @type{String} */
	thumbnail

	/** @type{String} */
	author

	/** @type{String} */
	authorTitle

	/** @type{String} */
	authorPic

	/** @type{String} */
	customCSS

	/**
	 * @param {BlogPost} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(BlogPost, "BlogPost"); 

BlogPost.readTime = (blogPost) => {
	// Optimistic reading speed as many "words" will be syntax
    const avgWPM = 300;
    let readTime = blogPost.content ? Math.round(blogPost.content.split(" ").length / avgWPM) : 1;
	if (readTime < 1) readTime = 1;
	return readTime;
}

export default BlogPost;