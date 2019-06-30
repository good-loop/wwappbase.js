import React from 'react';
import BS, {classes} from './BS';

// use <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

// https://getbootstrap.com/docs/4.1/components/forms/#checkboxes-and-radios

BS.Checkbox = ({checked, value, label, onChange}) => {
	return (<div className="form-check">	
	<input className='form-check-input' type="checkbox" 
		value={value} onChange={onChange} checked={checked} />
	<label className="form-check-label">{label}</label>
</div>);
};

BS.Radio = ({checked, value, label, onChange}) => (<div className="form-check">	
	<input className='form-check-input' type="radio" value={value} onChange={onChange} checked={checked} />
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
	return (<i className={'fa fa-'+fa + (size? ' fa-'+size : '') + (className? ' '+className : '') } 
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
BS.Centre = BS.Center; // UK or US

// TODO manage btn-default vs btn-light / btn-secondary. Any other 3 v 4 differences??
BS.Button = ({children, className, ...stuff}) => <button className={className} {...stuff}>{children}</button>;

/**
 * 
 * @param width {Number[1,12]} Use width for cross-size width. Use sm,md,lg,xl for size-specific widths
 */
BS.Col = ({width, sm, md, lg, xl, children}) => <div className={classes({prefix:"col", sep:'-', "":width, sm, md, lg, xl, dflt:"col"})}>{children}</div>;

export default BS;