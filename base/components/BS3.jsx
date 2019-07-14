/**
 * Bootstrap 3.
 */
import React from 'react';
import BS, {join, classes} from './BS';
// https://getbootstrap.com/docs/3.3/css/#forms


// NB: the `!! checked` is to avoid React complaining about a change from uncontrolled to controlled.
BS.Checkbox = ({name, checked, value, label, onChange, inline}) => {
	const input = <input type="checkbox" name={name} value={value} onChange={onChange} checked={ !! checked} />;
	if (inline) {
		// no wrapping div - c.f. https://getbootstrap.com/docs/3.3/css/#checkboxes-and-radios
		return (<label className='checkbox-inline'>{input} {label}</label>);
	} else {
		// wrapping div
		return (<div className="checkbox"><label>{input} {label}</label></div>);
	}
};

/**
 * A radio input
 */
BS.Radio = ({name, checked, value, label, onChange, inline}) => inline?
	(
		<label className={inline? 'radio-inline' : null}>
			<input type="radio" name={name} value={value} onChange={onChange} checked={checked} />
			{label}
		</label>
	) : (
		<div className="radio">
			<label className={inline? 'radio-inline' : null}>
				<input type="radio" name={name} value={value} onChange={onChange} checked={checked} />
				{label}
			</label>
		</div>
	);


// TODO for LoginWidget
BS.Modal = ({show, onHide, className, children}) => {
	if ( !show ) return null;
	return (<div>
		<div className={join('modal fade in', className)} 
			style={{display:'block'}}
			tabIndex="-1" role="dialog">
			<div className="modal-dialog" role="document">
				<div className="modal-content">			 
					{children}
			</div></div>
		</div>
		<div className="modal-backdrop fade in"></div>
	</div>);
};

BS.Modal.Title = ({children}) => <h5 className="modal-title">{children}</h5>;
BS.Modal.Header = ({children}) => (
	<div className="modal-header">
		{children}
		<button type="button" className="close" data-dismiss="modal" aria-label="Close">
			<span aria-hidden="true">&times;</span>
		</button>
	</div>
);
BS.Modal.Body = ({children}) => <div className="modal-body">{children}</div>;
BS.Modal.Footer = ({children}) => <div className="modal-footer">{children}</div>;


BS.Alert = ({color='warning', children}) => {
	return <div role='alert' className={'alert alert-'+color}>{children}</div>
};

BS.Icon = ({name}) => <span className={'glyphicon glyphicon-'+name} aria-hidden="true" />;

/**
 * Utility for centering blocks
 */
BS.Center = ({children}) => <div className='text-center'>{children}</div>;
BS.Centre = BS.Center; // UK or US

/**
 * a bordered well (becomes a type of Card in BS4)
 */
BS.Well = ({children}) => <div className='well'>{children}</div>;

BS.Row = ({children}) => <div className='row'>{children}</div>;

/**
 * TODO does dflt col work in BS3??
 * @param width {Number[1,12]} Use width for cross-size width. Use sm,md,lg,xl for size-specific widths
 */
BS.Col = ({width, sm, md, lg, xl, children}) => <div className={classes({prefix:"col", sep:'-', "":width, sm, md, lg, xl, dflt:"col"})}>{children}</div>;


/**
 * @param placement {?String} e.g. "fixed-top"
 */
BS.Nav = ({children, className, placement="fixed-top", color="dark"}) => {
	return <nav className={join('navbar', placement? 'navbar-'+placement : null, color==='dark' || color==='inverse'? 'navbar-inverse' : null, className)}>{children}</nav>;
};

export default BS;

