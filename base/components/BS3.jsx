/**
 * Bootstrap 3.
 */
import React from 'react';
import BS from './BS';
// https://getbootstrap.com/docs/3.3/css/#forms

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

export default BS;

