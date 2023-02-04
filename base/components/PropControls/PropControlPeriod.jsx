import React, { useEffect, useState } from 'react';
import { Button, Col, Input, InputGroup, Row } from 'reactstrap';
import DataStore from '../../plumbing/DataStore';
import { oh } from '../Misc';

import PropControl, { fakeEvent, registerControl } from '../PropControl';

/**
 * Really two PropControls - with TODO some handy buttons for setting both
 */
function PropControlPeriod2({path, propStart="start",propEnd="end"}) {
    const setPeriod = (name, now=new Date()) => {
        // const now = new Date();
        let s, e;
        if (name==="last-month") {
            // Do we have any handy date arithmetic code??
            // NB date.getMOnth() is zero index
            s = now.getUTCFullYear()+"-"+oh(now.getMonth())+"-01";
            let se = now.getUTCFullYear()+"-"+oh(now.getMonth()+1)+"-01";
            let de = new Date(se);
            e = new Date(de.getTime() - 1).toISOString().substring(0, 10);
        }
        if (name==="last-quarter") {
            if (now.getMonth() < 3) {
                // Q4 prev year
                s = (now.getUTCFullYear()-1)+"-10-01";
                e = (now.getUTCFullYear()-1)+"-12-31";
            } else {
                // start month of last quarter = -3 and round down
                let sm = 1 + (3 * Math.floor((now.getMonth() - 3) / 3));
                s = (now.getUTCFullYear()-1)+"-"+oh(sm)+"-01";
                let se = now.getUTCFullYear()+"-"+oh(sm+3)+"-01";
                let de = new Date(se);
                e = new Date(de.getTime() - 1).toISOString().substring(0, 10);    
            }
        }
        if (s) DataStore.setValue(path.concat(propStart), s);
        if (e) DataStore.setValue(path.concat(propEnd), e);
    };
    return (<>
    <div className="flex-row">
        <Button color="outline-secondary" size="sm" onClick={e => setPeriod("last-month")}>Last Month</Button>
        <Button className="ml-2" color="outline-secondary" size="sm" onClick={e => setPeriod("last-quarter")}>Last Quarter</Button>
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
