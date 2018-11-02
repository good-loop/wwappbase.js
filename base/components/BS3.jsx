/**
 * Bootstrap 3.
 */
import React from 'react';
import BS from './BS';
// https://getbootstrap.com/docs/3.3/css/#forms

/**
 * Convenience for doing base-css-class + optional-extra-css-class
 */
const join = (...strings) => strings.filter(s => s).join(" ");

BS.Checkbox = ({name, checked, value, label, onChange, inline}) => (<div className="checkbox">
	<label className={inline? 'checkbox-inline' : null} >
		<input type="checkbox" name={name} value={value} onChange={onChange} checked={checked} />
		{label}
  </label>
</div>);

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

/**
 * Utility for centering blocks
 */
BS.Center = ({children}) => <div className='text-center'>{children}</div>;
BS.Centre = BS.Center; // UK or US
export default BS;

