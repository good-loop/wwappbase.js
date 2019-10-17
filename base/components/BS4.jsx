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
 * A card with a card-body, and optional image-cap, title and sub-title
 * See https://getbootstrap.com/docs/4.3/components/card/
 */
BS.Card = ({className, color, imgTop, title, subtitle, children}) => {
	return (<div className={join("card", color? 'border-'+color : null, className)} >
  	{imgTop? <img src={imgTop} className="card-img-top" /> : null}
  	<div className="card-body">
    {title? <h5 className="card-title">{title}</h5> : null}
	 {subtitle? <h6 className="card-subtitle text-muted">{subtitle}</h6> : null}
    {children}
  </div>
</div>);
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


/**
 * size {?string} sm | lg
 * default = outline-dark
 */
BS.Button = ({size, color='outline-dark', children, className, ...stuff}) => {
	if (color==='default') color = 'outline-dark'; // BS3->4 conversion
	return <button className={join('btn',color? 'btn-'+color:null, size?'btn-'+size:null, className)} {...stuff}>{children}</button>;
}


/**
 * @link https://getbootstrap.com/docs/4.3/components/navbar
 * 
 * @param placement {?String} e.g. "fixed-top"
 * @param color {?String} e.g. "dark"
 */
BS.Nav = ({children, className, placement="fixed-top", color="dark"}) => {
	const classes = ['navbar', 'navbar-expand-md', 'p-0', placement, color ? `navbar-${color} bg-${color}` : null, className];
	return <nav className={join(...classes)}>{children}</nav>;
};

export default BS;