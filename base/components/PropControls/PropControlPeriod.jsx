import React, { useEffect, useState } from 'react';
import { Button, Col, Input, InputGroup, Row } from 'reactstrap';
import DataStore from '../../plumbing/DataStore';
import { oh } from '../Misc';

import PropControl, { fakeEvent, registerControl } from '../PropControl';

/**
 * Really two PropControls - with TODO some handy buttons for setting both
 */
function PropControlPeriod2({path, propStart="start",propEnd="end"}) {
    const setPeriod = (name) => {
        const now = new Date();
        if (name==="last-month") {
            // Do we have any handy date arithmetic code??
            // NB date.getMOnth() is zero index
            let s = now.getUTCFullYear()+"-"+oh(now.getMonth())+"-01";
            let se = now.getUTCFullYear()+"-"+oh(now.getMonth()+1)+"-01";
            let de = new Date(se);
            let e = new Date(de.getTime() - 1).toISOString().substring(0, 10);
            // TODO bug where setting the value works but does not show in the UI
            // because of [rawValue]=useState() in PropControl
            DataStore.setValue(path.concat(propStart), s);
            DataStore.setValue(path.concat(propEnd), e);
        }
    };
    return (<>
    <div className="flex-row">
        <Button color="outline-secondary" size="sm" onClick={e => setPeriod("last-month")}>Last Month</Button>
        <Button className="ml-2" color="outline-secondary" size="sm" onClick={e => setPeriod("TODO last-quarter")}>Last Quarter</Button>
    </div>
    <Row>
        <Col>
        <PropControl prop={propStart} path={path} label type="date" />
    </Col><Col>
            <PropControl prop={propEnd} path={path} label type="date" />
        </Col>
    </Row></>);
}


// registerControl({ type: 'period', $Widget: PropControlPeriod2 });

function PropControlPeriod(p) {
    // HACK a bit of the machinery from PropControl
    if ( ! p?.path) {
        p = Object.assign({path:['location', 'params']}, p);
    }
  return <PropControlPeriod2 type="period" {...p} />;
}
export default PropControlPeriod;
