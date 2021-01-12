
import Enum from 'easy-enums';

/**
 * NB: PUBLISHED -> MODIFIED on edit is set by the server (see AppUtils.java doSaveEdit(), or trace usage of KStatus.MODIFIED)
 */
const KStatus = new Enum('DRAFT PUBLISHED MODIFIED REQUEST_PUBLISH PENDING ARCHIVED TRASH ALL_BAR_TRASH PUB_OR_ARC PUB_OR_DRAFT');

export default KStatus;
