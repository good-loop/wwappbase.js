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
	if ( ! show) return null;
	return (<div>
		<div className={join('modal fade in', className)} 
			style={{display:'block'}}
			tabIndex="-1" role="dialog">
			<div class="modal-dialog" role="document">
				<div class="modal-content">			 
					{children}
			</div></div>
		</div>
		<div class="modal-backdrop fade in"></div>
	</div>);
};

BS.Modal.Title = ({children}) => <h5 class="modal-title">{children}</h5>;
BS.Modal.Header = ({children}) => (<div class="modal-header">
	{children}
	<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
	</div>);
BS.Modal.Body = ({children}) => <div class="modal-body">{children}</div>;
BS.Modal.Footer = ({children}) => <div class="modal-footer">{children}</div>;


BS.Alert = ({color='warning', children}) => {
	return <div role='alert' className={'alert alert-'+color}>{children}</div>
};

export default BS;

