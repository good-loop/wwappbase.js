// @Flow
import React, { Component } from 'react';
import { Form, FormGroup, Col } from 'reactstrap';

import { StripeProvider, Elements, injectStripe,
	CardNumberElement, CardExpiryElement, CardCVCElement,
	PaymentRequestButtonElement } from 'react-stripe-elements';

import C from '../CBase';
import Money from '../data/Money';
import Transfer from '../data/Transfer';
import {assMatch} from 'sjtest';
import Misc from './Misc';
import DataStore from '../plumbing/DataStore';

// falsy value for SERVER_TYPE = production
const stripeKey = (C.SERVER_TYPE) ?
	'pk_test_RyG0ezFZmvNSP5CWjpl5JQnd' // test
	: 'pk_live_InKkluBNjhUO4XN1QAkCPEGY'; // live

const SKIP_TOKEN = {
	id: 'skip_token',
	type: 'card',
};
const CREDIT_TOKEN = {
	id: 'credit_token',
	type: 'credit',
};
const FREE_TOKEN = {
	id: 'free_token',
	type: 'free',
};
/** minimal transation amount by currency
// table copied from https://stripe.com/docs/currencies (31/08/18) */
const STRIPE_MINIMUM_AMOUNTS = {
	'GBP': 0.5,
	'USD': 0.75,
	'EUR': 0.75,
	'AUD': 0.75,
	'CAD': 0.5,
	'BRL': 0.5,
	'CHF': 0.5,
	'DKK': 2.5,
	'HKD': 4,
	'JPY': 50,
	'MXN': 10,
	'NOK': 3,
	'NZD': 0.5,
	'SEK': 3,
	'SGD': 0.5
};

/**
 * amount: {?Money} if null, return null
 * recipient: {!String}
 * onToken: {!Function} inputs: token|source, which are similar but different. Sources can be reused
 * 	token = {id:String, type:String, token:String, email:String, type:"card", object:"token"}
 * 	source = {id, card:object, owner: {email, verified_email}, type:"card", object:"source"}
 * 	Called once the user has provided payment details, and we've got a token back from Stripe.
 * 	This should then call the server e.g. by publishing a donation - to take the actual payment.
 * 	The token string is either a Stripe authorisation token, or one of the fixed special values (e.g. credit_token).
 * @param {?Boolean} testOption true/false to show/hide the pretend-I-paid option. Defaults to true on test or local.
 */
const PaymentWidget = ({amount, onToken, recipient, email, usePaymentRequest, error, testOption}) => {
	if ( ! amount) {
		return null; // no amount, no payment
	}
	if (testOption===undefined) {
		testOption = ! C.isProduction();
	}
	Money.assIsa(amount, "PaymentWidget.jsx");
	assMatch(onToken, Function, "PaymentWidget.jsx");
	assMatch(recipient, String, "PaymentWidget.jsx");

	// Money = £0? Then just a confirm button
	if (Money.value(amount) === 0) {
		const payNothing = (event) => (
			onToken({
				...FREE_TOKEN,
				email,
			})
		);
		return (
			<div className='PaymentWidget'>
				<button onClick={payNothing} className='btn btn-primary'>Confirm Free Purchase</button>
			</div>
		);
	} // ./ £0

	// Invoke the callback, with a minimal fake token that the servlet will catch
	const skipAction = (event) => (
		onToken({
			...SKIP_TOKEN,
			email,
		})
	);
	const payByCredit = (event) => (
		onToken({
			...CREDIT_TOKEN,
			email,
		})
	);

	// pay on credit??
	let credit = Transfer.getCredit(); // ??This is kind of SoGive specific
	if (credit && Money.value(credit) > 0) {
		if (Money.value(credit) >= Money.value(amount)) {
			return (
				<div className='section donation-amount'>
					<p>You have <Misc.Money amount={credit} /> in credit which will pay for this.</p>
					<button onClick={payByCredit} className='btn btn-primary'>Send Payment</button>
				</div>
			);
		}
	} // ./credit
	
	return (
		<div className='section donation-amount'>
			<StripeProvider apiKey={stripeKey}>
				<Elements>
					<StripeThings onToken={onToken} amount={amount} credit={credit} recipient={recipient}
						email={email} usePaymentRequest={usePaymentRequest} serverError={error}
					/>
				</Elements>
			</StripeProvider>

			{error? <div className='alert alert-danger'>{error}</div> : null}

			{testOption? (
				<small className='clear'>
					Test card no: 4000008260000000 (use any CVC and any future expiry date).
					Stolen test card no: 4000000000009979.
					Or
					<button onClick={skipAction}>test: pretend I paid</button>
				</small>
			) : null}
		</div>
	);
};

/**
 * Stripe widgets manage their own state.
 
 * @Roscoe: Why can't we use DataStore for state? Thanks, Dan
 * @DW: Stripe widgets are wrapped in iframes specifically to promote Stripe's trust model of
 * "we provide the widgets and the host page can't touch your CC data".
 * It's conceivable we could pry that data out, but it's not a good idea.
 */
class StripeThingsClass extends Component {
	constructor(props) {
		super(props);

		const {amount, credit, onToken, recipient, email} = props;

		let residual = amount;
		// NB dont add on prior debts
		if (credit && Money.value(credit) > 0) {
			residual = Money.sub(amount, credit);
		}

		// Native widget?
		/* We might be able to forgo the rigmarole of collecting
		+ submitting CC data ourselves, if the browser supports
		the generic Payments API or has Google Wallet / Apple Pay
		integration. Stripe gives us a pre-rolled button which
		extracts a Stripe payment token from these services.
		Here, we check if it's available - in render(), if it is,
		we skip showing the form and just present a flashy "Pay"
		button. */
		// ?? Does this widget get stuck on the first amount?
		// See SoGive bug report: https://issues.soda.sh/stream?tag=148924
		const paymentRequest = props.stripe.paymentRequest({
			country: 'GB',
			currency: (amount.currency || 'gbp').toLowerCase(),
			total: {
				label: `Payment to ${recipient}`,
				amount: Math.round(residual.value * 100), // uses pence
			},
		});

		paymentRequest.on('token', ({complete, token, ...data}) => {
			console.log('paymentRequest received Stripe token: ', token);
			console.log('paymentRequest received customer information: ', data);
			onToken(token);
			complete('success');
		});

		// TODO do this earlier to avoid a redraw glitch
		paymentRequest.canMakePayment().then(result => {
			this.setState({canMakePayment: !!result});
		});

		this.state = {
			canMakePayment: false,
			paymentRequest,
			email
		};
	} // ./constructor


	handleSubmit(event) {
		console.log("PaymentWidget - handleSubmit", event);
		// Don't submit and cause a pageload!
		event.preventDefault();
		// block repeat clicks, and clear old errors
		this.setState({stripeError: false, errorMsg: '', isSaving: true});

		// Within the context of `Elements`, this call to createToken knows which Element to
		// tokenize, since there's only one in this group.
		let tokenInfo = {
			// name: this.props.username,
			type: "card"
		};
		let ownerInfo = {
			name: this.props.username,
			email: this.state.email
		};
		// get the token or reusable source from stripe
		// see https://stripe.com/docs/sources/cards
		// TODO update to https://stripe.com/docs/payments/payment-intents
		this.props.stripe.createSource(tokenInfo, ownerInfo)		// Token(tokenInfo)
			// then call custom processing (e.g. publish donation)
			.then(({token, source, error, ...data}) => {
				if (source) {
					this.props.onToken(source);
				} else if (token) {
					this.props.onToken(token);
				} else {
					this.setState({stripeError: error, errorMsg: error && error.message, isSaving: false});
				}
			})
			// on abject (eg. network) failure, mark the form as active again
			.catch(() => this.setState({isSaving: false}));
	} //./handleSubmit()


	render() {
		if (this.state.canMakePayment && this.props.usePaymentRequest) {
			return (<PaymentRequestButtonElement paymentRequest={this.state.paymentRequest} />);
		}

		const {amount, recipient, credit} = this.props;
		const {value, currency} = amount;
		const isSaving = this.state.isSaving && ! this.props.serverError;
		const isValidAmount = value >= STRIPE_MINIMUM_AMOUNTS[currency]
		// TODO an email editor if this.props.email is unset
		return (
			<Form inline onSubmit={(event) => this.handleSubmit(event)}>
				<h3>Payment of <Misc.Money amount={amount} /> to {recipient}</h3>
				{credit && Money.value(credit) > 0?
					<FormGroup><Col md="12">
						You have <Misc.Money amount={credit} /> in credit which will be used towards this payment.
					</Col></FormGroup>
				: null}
				<FormGroup>
					<Col md="12">
						<label>Card number</label>
						<div className='form-control'>
							<CardNumberElement placeholder='0000 0000 0000 0000' />
						</div>
					</Col>
				</FormGroup>
				<FormGroup>
					<Col md="6">
						<label>Expiry date</label>
						<div className='form-control'>
							<CardExpiryElement />
						</div>
					</Col>
					<Col md="6">
						<label>CVC</label>
						<div className='form-control'>
							<CardCVCElement />
						</div>
					</Col>
				</FormGroup>

				<button className='btn btn-primary btn-lg pull-right' type='submit'
					disabled={isSaving || !isValidAmount}
					title={isValidAmount ? null : 'Your payment must be at least ' + STRIPE_MINIMUM_AMOUNTS[currency] + currency}
					>Submit Payment</button>

				{this.state.errorMsg? <div className='alert alert-danger'>{this.state.errorMsg}</div> : null}
			</Form>
		);
	} // ./render()
} // ./StripeThingsClass

const StripeThings = injectStripe(StripeThingsClass);

export {SKIP_TOKEN};
export default PaymentWidget;
