import React, { useEffect, useState } from 'react';
import { Button, Col, Input, InputGroup, Row } from 'reactstrap';
import DataStore from '../../plumbing/DataStore';
import { isoDate } from '../../utils/miscutils';
import Misc, { MONTHS, oh } from '../Misc';

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
    // NB: start of next month = end of day previous month
    let lastMonthEnd = de.toISOString().substring(0, 10);
    // ...quarter
    let lastQuarterStart, lastQuarterEnd;
    if (now.getMonth() < 3) {
        // Q4 prev year
        lastQuarterStart = (now.getUTCFullYear()-1)+"-10-01";
        lastQuarterEnd = now.getUTCFullYear()+"-01-01";
    } else {
        // start month of last quarter = -3 and round down
        let sm = 1 + (3 * Math.floor((now.getMonth() - 3) / 3));
        lastQuarterStart = (now.getUTCFullYear()-1)+"-"+oh(sm)+"-01";
        let qe = now.getUTCFullYear()+"-"+oh(sm+3)+"-01";
        let dqe = new Date(qe);
        lastQuarterEnd = dqe.toISOString().substring(0, 10);    
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

function PropControlPeriodMonthYear({path, propStart="start",propEnd="end"}) {
    let startv = DataStore.getValue(path.concat(propStart));
    let endv = DataStore.getValue(path.concat(propEnd));
    let wpath = ["widget"].concat(path);
    const now = new Date();
    // change form convenience inputs into ImpactDebit fields
    let month = DataStore.getValue(wpath.concat("month"));
    let year = DataStore.getValue(wpath.concat("year"));
    if (month && year) {
        startv = year+"-"+oh(MONTHS.indexOf(month)+1)+"-01";
        let startNextMonth = year+"-"+oh(MONTHS.indexOf(month)+2)+"-01";
        if (startNextMonth.includes("-13-")) {
            startNextMonth = ((year*1)+1)+"-01-01"; // NB force year to be a number so we can +1
        }
        let dend = new Date(new Date(startNextMonth).getTime() - 1);
        endv = isoDate(dend);
        DataStore.setValue(path.concat(propStart), startv);
        DataStore.setValue(path.concat(propEnd), endv);        
    }

    return (<><Row>
        <Col><PropControl type="select" prop="month" label options={MONTHS} path={wpath} />
        </Col><Col>
        <PropControl type="select" prop="year" label options={[now.getFullYear()-1, now.getFullYear()]} path={wpath} dflt={now.getFullYear()} />
        </Col>
    </Row>
    <p><small>start: <Misc.DateTag date={startv} /> end: <Misc.DateTag date={endv} /></small></p>
    </>);
}

/**
 * This is NOT actually a PropControl -- it wraps TWO PropControls (start, end)
 * @param {Object} p
 * @param {?String[]} p.path 
 * @param {?String} p.propStart default:start
 * @param {?String} p.propEnd default:end
 * @param {?String} p.options HACK if "month-year" then use a simplified month/year picker
 * @returns 
 */
function PropControlPeriod(p) {
    // HACK a bit of the machinery from PropControl
    if ( ! p?.path) {
        p = Object.assign({path:['location', 'params']}, p);
    }
    // HACK how shall we switch format?
    if (p.options && (""+p.options).includes("month")) {
        return <PropControlPeriodMonthYear {...p} />;
    }
  return <PropControlPeriod2 type="period" {...p} />;
}
export default PropControlPeriod;
