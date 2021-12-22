import DataClass from './DataClass';
import Enum from 'easy-enums';

const KGreenTagType = new Enum('PIXEL REDIRECT WRAPPER');
const KMacroType = new Enum('NONE XANDR GOOGLE TTD');

/** Used by Green Ad Tag generator */
const REDIRECT_BASE = `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/lg`;
const PXL_BASE = `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/lg`;
const GREENVAST = `${C.HTTPS}://${C.SERVER_TYPE}as.good-loop.com/greenvast.xml`;

/*
  TODO Instead of using a one-size-fits-all regex (this one doesn't cover many common macro formats),
  encodePreserveMacros should use the tag's macroType to decide which DSP-specific regex to use.
*/
const macroRegex = /(\$?[\{\]]\w+[\}\]])/;
// Split out macros and preserve delimiters before URL-component-encoding the rest
const encodePreserveMacros = targetUrl => (
  targetUrl.split(macroRegex).reduce((acc, bit) => {
    if (bit.match(macroRegex)) return acc + bit;
    return acc + encodeURIComponent(bit);
  }, '')
);


const generators = {
  PIXEL: (tag) => {
    return `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/pxl.png?d=green&t=pixel&campaign=${encodeURIComponent(tag.campaign)}`;
  },
  REDIRECT: (tag) => {
    // TODO see macroRegex above - use 
    const tgtUrlEncoded = encodePreserveMacros(tag.wrapped, tag.macroType);
    const evtTag = tag.evt;
    return `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/lg?d=green&t=redirect&campaign=${encodeURIComponent(tag.campaign)}&link=${tgtUrlEncoded}`;
  },
  WRAPPER: (tag) => {
    return `${C.HTTPS}://${C.SERVER_TYPE}as.good-loop.com/greenvast.xml`;
  }
};


/**
 */
class GreenTag extends DataClass {
  constructor(base) {
		super();
		DataClass._init(this, base);

    if (!this.tagType) this.tagType = KGreenTagType.PIXEL;
    if (!this.macroType) this.macroType = KMacroType.NONE;
	}

  /** User-recognisable name */
	name;
  /** Campaign to group impressions for multiple tags */
  campaign;
  /** Tag type, e.g. pixel, redirect, VAST wrapper */
  tagType;
  /** Macro type for target DSP, e.g. google, xandr */
  macroType;
	/** (For WRAPPER and REDIRECT tagType) The user's original tag which this wraps/redirects */
  wrapped;
  /** The generated tag URL */
  tag;
}

GreenTag.generate = (tag) => {
  const generator = generators[tag.tagType] || generators.PIXEL;
  return generator(tag);
}

DataClass.register(GreenTag, "GreenTag");
const This = GreenTag;
export default GreenTag;

export { KGreenTagType, KMacroType };
