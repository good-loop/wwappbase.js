import React from 'react';
import BS, {join, classes} from './BS';
// for now at least, we build on BS3, overwriting the changed parts
import BS3 from './BS3';

BS.version = 4;

// use <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

// https://getbootstrap.com/docs/4.1/components/forms/#checkboxes-and-radios

// NB: the `!! checked` is to avoid React complaining about a change from uncontrolled to controlled.
BS.Checkbox = ({checked, value, label, onChange}) => {
	return (<div className="form-check">	
	<input className='form-check-input' type="checkbox" 
		value={value} onChange={onChange} checked={ !! checked} />
	<label className="form-check-label">{label}</label>
</div>);
};

BS.Radio = ({checked, value, label, onChange}) => (<div className="form-check">	
	<input className='form-check-input' type="radio" value={value} onChange={onChange} checked={!!checked} />
	<label className="form-check-label">{label}</label>
</div>);

BS.Alert = ({color='warning', children}) => {
	return <div role='alert' className={'alert alert-'+color}>{children}</div>
};

/**
 * BS3 shipped with Glyphicons. But they turned evil, so BS4 ships without.
 */
BS.Icon = ({name, size, className, ...other}) => {
	// Use Font-Awesome??
	return (<i className={'fa fa-'+name + (size? ' fa-'+size : '') + (className? ' '+className : '') } 
				aria-hidden="true" {...other} />);
};
/**
 * Map from old glyphicon names to new names
 */
BS.iconMap = {

};

/**
 * Utility for centering blocks
 */
BS.Center = ({children}) => <div className='ml-auto mr-auto'>{children}</div>;


// TODO manage btn-default vs btn-light / btn-secondary. Any other 3 v 4 differences??
BS.Button = ({children, className, ...stuff}) => <button className={className} {...stuff}>{children}</button>;


/**
 * @link https://getbootstrap.com/docs/4.3/components/navbar
 * 
 * @param placement {?String} e.g. "fixed-top"
 * @param color {?String} e.g. "dark"
 */
BS.Nav = ({children, className, placement="fixed-top", color="dark"}) => {
	return <nav className={join('navbar', 'navbar-expand-md', placement, color? 'navbar-'+color : null, color? 'bg-'+color : null, className)}>{children}</nav>;
};

export default BS;