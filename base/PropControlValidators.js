const PropControlValidators;

PropControlValidators.dateValidator = (v, rawValue) => {
    if ( ! v) {
        // raw but no date suggests the server removed it
        if (rawValue) return 'Please use the date format yyyy-mm-dd';
        return null;
    }
    try {
        let sdate = "" + new Date(v);
        if (sdate === 'Invalid Date') {
            return 'Please use the date format yyyy-mm-dd';
        }
    } catch (er) {
        return 'Please use the date format yyyy-mm-dd';
    }
};

PropControlValidators.urlValidator = v => {
    // TODO detect invalid url
    if (v && v.substr(0,5) === 'http:') {
        return "Please use https for secure urls";
    }
    return null;
};

PropControlValidators.moneyValidator = v => {
    if ( ! v) return null;
    let nv = Money.value(v);	
    if ( ! Number.isFinite(nv)) {
        return "Invalid number "+v.raw;
    }
    if (Math.round(nv*100) != nv*100) {
        return "Fractional pence may cause an error later "+v.raw;
    }
    return null;
};

export default PropControlValidators;

