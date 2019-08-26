/**
 * Bootstrap 3.
 */
import React from 'react';
import BS, {join, classes} from './BS';
// https://getbootstrap.com/docs/3.3/css/#forms

BS.version = 3;

/** A checkbox input */
BS.Checkbox = (props) => binaryInput({type: 'checkbox', ...props});

/** A radio input */
BS.Radio = (props) => binaryInput({type: 'radio', ...props});

/** Common code for checkbox and binary */
const binaryInput = ({type, name, checked, value, label, onChange, inline}) => {
	// Double-invert checked to coerce it from undefined to false so React doesn't complain about changing from uncontrolled to controlled input
	const input = <input type={type} name={name} value={value} onChange={onChange} checked={!!checked} />;
	// No wrapping div for inline - c.f. https://getbootstrap.com/docs/3.3/css/#checkboxes-and-radios
	return inline ? (
		<label className={`${type}-inline`}> {input} {label} </label>
	) : (
		<div className={type}><label> {input} {label} </label></div>
	);
};


/**
 * Polyfill for BS4's Card type using Panel
 * See https://getbootstrap.com/docs/4.3/components/card/ vs https://getbootstrap.com/docs/3.4/components/#panels
 */
BS.Card = ({className, color, imgTop, title, subtitle, children}) => {
	return (<div className={join("panel panel-"+(color||'default'), className)} >
	{imgTop? <img src={imgTop} class="card-img-top" /> : null}
	{title? <div className='panel-heading'><h5 className="panel-title">{title}</h5>{subtitle? <h6 className="card-subtitle text-muted">{subtitle}</h6> : null}</div> : null}
	{children? <div className="panel-body">{children}</div> : null}
</div>);
};

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
BS.Col = ({width, sm, md, lg, xl, children}) => <div className={classes({prefix: 'col', sep: '-', '': width, sm, md, lg, xl, dflt: 'col'})}>{children}</div>;


/**
 * @param show {Boolean} The caller must manage show / closed via this + onHide()
 */
BS.Modal = ({children, show, className, onHide}) => {
	const cs = join('modal fade', show ? 'show' : null);

	// Add onHide to children
	if (children) {
		// NB: with one child is not an array
		if ( ! _.isArray(children)) children = [children];
		// filter null, undefined
		children = children.filter(x => !! x);
		children = React.Children.map(children, (Kid, i) => {
			// clone with onHide
			return React.cloneElement(Kid, {onHide});
		});
	}

	// TODO listen for Esc -- add/remove a handler with useEffect

	return (
		<div>
			<div className={cs} style={{display: show?'block':'none'}} tabIndex="-1" role="dialog" onClick={e => onHide(e)}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						{children}
					</div>
				</div>
			</div>
			<div className={join("modal-backdrop fade", show?'show':null)}></div>
		</div>
	);
};

BS.Modal.Header = ({logo, title, children, onHide}) => {
	return (
		<div className="modal-header">
			{title? <BS.Modal.Title title={title} /> : null}
			{children}
			<button type="button" className="close" aria-label="Close" onClick={e => onHide(e)}>
				<span aria-hidden="true">&times;</span>
			</button>
		</div>
	);
};

BS.Modal.Title = ({logo, title, children}) => <h5 className="modal-title">{logo} {title} {children}</h5>;

BS.Modal.Body = ({children}) => <div className='modal-body'>{children}</div>;

BS.Modal.Footer = ({children}) => <div className='modal-footer'>{children}</div>;


/**
 * @param placement {?String} e.g. "fixed-top"
 */
BS.Nav = ({children, className, placement = 'fixed-top', color = 'dark'}) => {
	const classes = ['navbar', placement ? `navbar-${placement}` : null, {dark: 1, inverse: 1}[color] ? 'navbar-inverse' : null, className];
	return <nav className={join(...classes)}> {children} </nav>;
};

export default BS;

