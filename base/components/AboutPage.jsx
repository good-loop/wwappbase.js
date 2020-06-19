import React from 'react';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import C from '../CBase';
import Roles from '../Roles';
import Misc from './Misc';

const AboutPage = () => {
	let website = C.app.website; // ?? default to top-level domain
	return (
		<div className="AboutPage">
			<h1>About {C.app.name}</h1>
			{C.app.logo? <img src={C.app.logo} className="img-thumbnail logo-large pull-right" /> : null}

			<p>Please see our website for more information on {C.app.name}: <a href={website}>{website}</a></p>

			{C.app.facebookAppId? <a href={'https://www.facebook.com/games/?app_id="+C.app.facebookAppId'}><Misc.Logo service="facebook" /> facebook</a> : null}

			<p>Software version: <i>{JSON.stringify(C.app.version || 'alpha')}</i></p>

			<p>We are grateful to SMART:Scotland and The Hunter Foundation for their support.</p>

			<p>This app uses data from various sources:</p>
			<ul>
				<li>&copy; Crown Copyright and database right 2017. Data from the Scottish Charity Register supplied by the Office of the Scottish Charity Regulator and licensed under the Open Government Licence v.2.0.
					See <a href="https://www.oscr.org.uk/charities/search-scottish-charity-register/charity-register-download">OSCR Charity Register Download</a>.
				</li>
			</ul>

		</div>
	);
};

export default AboutPage;
