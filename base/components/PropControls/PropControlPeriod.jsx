import React, { useEffect, useState } from 'react';
import { Button, Col, Input, InputGroup, Row } from 'reactstrap';
import DataStore from '../../plumbing/DataStore';
import { oh } from '../Misc';

import PropControl, { fakeEvent, registerControl } from '../PropControl';

/**
 * Really two PropControls - with TODO some handy buttons for setting both
 */
function PropControlPeriod2({path, propStart="start",propEnd="end"}) {
    // start/end button logic (ugly)
    let startv = DataStore.getValue(path.concat(propStart));
    let endv = DataStore.getValue(path.concat(propEnd));
    // Do we have any handy date arithmetic code??
    // NB date.getMOnth() is zero index
    const now=new Date();
    // TODO handle dec/jan
    let lastMonthStart = now.getUTCFullYear()+"-"+oh(now.getMonth())+"-01";
    let se = now.getUTCFullYear()+"-"+oh(now.getMonth()+1)+"-01";
    let de = new Date(se);
    let lastMonthEnd = new Date(de.getTime() - 1).toISOString().substring(0, 10);
    // ...quarter
    let lastQuarterStart, lastQuarterEnd;
    if (now.getMonth() < 3) {
        // Q4 prev year
        lastQuarterStart = (now.getUTCFullYear()-1)+"-10-01";
        lastQuarterEnd = (now.getUTCFullYear()-1)+"-12-31";
    } else {
        // start month of last quarter = -3 and round down
        let sm = 1 + (3 * Math.floor((now.getMonth() - 3) / 3));
        lastQuarterStart = (now.getUTCFullYear()-1)+"-"+oh(sm)+"-01";
        let qe = now.getUTCFullYear()+"-"+oh(sm+3)+"-01";
        let dqe = new Date(qe);
        lastQuarterEnd = new Date(dqe.getTime() - 1).toISOString().substring(0, 10);    
    }
    // button click
    const setPeriod = (name) => {
        // const now = new Date();
        let s, e;
        if (name==="last-month") {
            s = lastMonthStart;
            e = lastMonthEnd;
        }
        if (name==="last-quarter") {
            s = lastQuarterStart;
            e = lastQuarterEnd;
        }
        if (s) DataStore.setValue(path.concat(propStart), s);
        if (e) DataStore.setValue(path.concat(propEnd), e);
    };
    // jsx
    return (<>
    <div className="flex-row">
        <Button active={startv===lastMonthStart && endv===lastMonthEnd} color="outline-secondary" size="sm" onClick={e => setPeriod("last-month")}>Last Month</Button>
        <Button active={startv===lastQuarterStart && endv===lastQuarterEnd} className="ml-2" color="outline-secondary" size="sm" onClick={e => setPeriod("last-quarter")}>Last Quarter</Button>
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

/**
 * This is NOT actually a PropControl -- it wraps TWO PropControls (start, end)
 * @param {Object} p
 * @param {?String[]} p.path 
 * @param {?String} p.propStart default:start
 * @param {?String} p.propEnd default:end
 * @returns 
 */
function PropControlPeriod(p) {
    // HACK a bit of the machinery from PropControl
    if ( ! p?.path) {
        p = Object.assign({path:['location', 'params']}, p);
    }
  return <PropControlPeriod2 type="period" {...p} />;
}
export default PropControlPeriod;
