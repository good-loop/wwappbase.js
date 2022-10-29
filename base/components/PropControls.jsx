/**
 * Import the standard propcontrols, so that they get registered.
 * 
 * Usage: import this once in app.jsx
 * 
 */

 // Just importing these gets them registered with PropControl
import PropControlUrl from './PropControls/PropControlUrl';
import PropControlUpload from './PropControls/PropControlUpload'
import PropControlPills from './PropControlPills';
import PropControlSelection from './PropControlSelection';
import PropControlDataItem from './PropControlDataItem';
import PropControlMoney from './PropControlMoney';
import PropControlDt from './PropControls/PropControlDt';
// import PropControlEgo from './PropControls/PropControlEgo';
// import PropControlCode from './PropControls/PropControlCode'; this pulls in prism.js as a dependency, so not included in all projects
import PropControlToggle from './PropControls/PropControlToggle';

import PropControlImg from './PropControls/PropControlImg';

// no real export - use via PropControl
export default {};
