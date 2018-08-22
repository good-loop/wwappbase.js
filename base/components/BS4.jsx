import React from 'react';
import BS from './BS';

// https://getbootstrap.com/docs/4.1/components/forms/#checkboxes-and-radios

BS.Checkbox = ({checked, value, label, onChange}) => (<div className="form-check">	
	<input className='form-check-input' type="checkbox" value={value} onChange={onChange} checked={checked} />
	<label className="form-check-label">{label}</label>
</div>);

BS.Radio = ({checked, value, label, onChange}) => (<div className="form-check">	
	<input className='form-check-input' type="radio" value={value} onChange={onChange} checked={checked} />
	<label className="form-check-label">{label}</label>
</div>);

export default BS;