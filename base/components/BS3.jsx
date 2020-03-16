/**
 * Bootstrap 3.
 */
import React from 'react';
import BS, {space, classes} from './BS';
// https://getbootstrap.com/docs/3.3/css/#forms

const stopPropagation = e => e.stopPropagation();

BS.version = 3;


/** Common code for checkbox and binary */
const BinaryInput = ({type, name, checked, value, label, onChange, inline}) => {
	// Double-invert checked to coerce it from undefined to false so React doesn't complain about changing from uncontrolled to controlled input
	const input = <input type={type} name={name} value={value} onChange={onChange} checked={!!checked} />;
	// No wrapping div for inline - c.f. https://getbootstrap.com/docs/3.3/css/#checkboxes-and-radios
	return inline ? (
		<label className={`${type}-inline`}> {input} {label} </label>
	) : (
		<div className={type}><label> {input} {label} </label></div>
	);
};

/** A checkbox input */
BS.Checkbox = (props) => <BinaryInput type="checkbox" {...props} />;

/** A radio input */
BS.Radio = (props) => <BinaryInput type="radio" {...props} />;


BS.InputGroup = ({className, children}) => <div class={space("input-group", className)}>{children}</div>;

BS.InputGroup.Append = ({children}) => <span class="input-group-addon">{children}</span>;

/**
 * Polyfill for BS4's Card type using Panel
 * See https://getbootstrap.com/docs/4.3/components/card/ vs https://getbootstrap.com/docs/3.4/components/#panels
 */
BS.Card = ({className, color, imgTop, title, subtitle, children}) => {
	return (<div className={space("panel panel-"+(color||'default'), className)} >
	{imgTop ? <img src={imgTop} class="card-img-top" /> : null}
	{title ? <div className='panel-heading'><h5 className="panel-title">{title}</h5>
		{subtitle ? <h6 className="card-subtitle text-muted">{subtitle}</h6> : null}
	</div> : null}
	{children ? <div className="panel-body">{children}</div> : null}
</div>);
};


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
BS.Well = ({children, className, ...props}) => <div className={space('well', className)} {...props}>{children}</div>;

BS.Row = ({children, className, ...props}) => <div className={space('row', className)} {...props}>{children}</div>;

/**
 * e.g. <BS.Col width={3} />
 * "does dflt col work in BS3??"
 * Column widths propagate up to bigger screens so in BS3 you use col-xs-* for default size -- Roscoe
 * @param width {Number[1,12]} Use width for cross-size width. Use sm,md,lg,xl for size-specific widths
 */
BS.Col = ({width, sm, md, lg, xl, children}) => (
	<div className={classes({prefix: 'col', sep: '-', xs: width, sm, md, lg, xl, dflt: 'col'})}>
		{children}
	</div>
);


/**s4
 * @param show {Boolean} The caller must manage show / closed via this + onHide()
 */
BS.Modal = ({children, show, className, onHide}) => {
	const showClass = show ? 'show' : null;
	const style = {display: show ? 'block' : 'none'};

	// Add onHide to children
	if (children) {
		children = React.Children.map(children, child => (
			!!child && React.cloneElement(child, {onHide})
		));
	}

	// TODO listen for Esc -- add/remove a handler with useEffect

	return <>
		<div className={space('modal fade', showClass, className)} style={style} tabIndex="-1" role="dialog" onClick={onHide}>
			<div className="modal-dialog" role="document" onClick={stopPropagation}>
				<div className="modal-content">
					{children}
				</div>
			</div>
		</div>
		<div className={space("modal-backdrop fade", showClass)}></div>
	</>;
};

/** TODO Pass logo down to BS.Modal.Title? */
BS.Modal.Header = ({logo, title, children, onHide}) => {
	return (
		<div className="modal-header">
			{title ? <BS.Modal.Title title={title} /> : null}
			{children}
			<button type="button" className="close" aria-label="Close" onClick={onHide}>
				<span aria-hidden="true">&times;</span>
			</button>
		</div>
	);
};

BS.Modal.Title = ({logo, title, children}) => <h5 className="modal-title">{logo} {title} {children}</h5>;

BS.Modal.Body = ({children}) => <div className="modal-body">{children}</div>;

BS.Modal.Footer = ({children}) => <div className="modal-footer">{children}</div>;


/**
 * size = lg|sm
 * Use `onClick` to pass in a click handler.
 */
BS.Button = ({size, color = 'default', children, className, ...stuff}) => (
	<button className={space('btn', color && `btn-${color}`, size && `btn-${size}`, className)} {...stuff}>{children}</button>
);

/**
 * @param placement {?String} e.g. "fixed-top"
 */
BS.Nav = ({children, className, placement = 'fixed-top', color = 'dark'}) => {
	const classes = ['navbar', placement ? `navbar-${placement}` : null, {dark: 1, inverse: 1}[color] ? 'navbar-inverse' : null, className];
	return <nav className={space(...classes)}> {children} </nav>;
};

/**
 * @param children e.g. <a class="nav-link" href="#">Link</a>
 */
BS.NavTabs = ({children}) => {
	if ( ! children) children = [];
	return <ul className='nav nav-tabs'>{children.map((kid, i) => <li key={i} className='nav-item'>{kid}</li>)}</ul>;
};


export default BS;

