module.exports = {
	"extends": "airbnb",
	"plugins": [
		"react",
		"jsx-a11y",
		"import"
	],
	"rules": {
		"arrow-body-style": "off",
		"arrow-parens": "off",
		"brace-style": "warn",
		"camelcase": "off", // we use camelCase, but we also break it in places, e.g. myFn2_subFn()
		"class-methods-use-this": "off",
		"comma-dangle": "off",
		"comma-spacing": "off",
		"consistent-return": "warn",
		"default-case": "off",
		"func-names": "off",
		"function-paren-newline": "off",
		"implicit-arrow-linebreak": "off",
		"import/extensions": "warn",
		"import/first": "warn",
		"import/newline-after-import": "warn",
		"import/no-named-as-default-member": "off",
		"import/no-named-as-default": "off",
		"import/order": "warn",		"import/prefer-default-export": "warn",
		"indent": ["warn", "tab"],
		"jsx-a11y/alt-text": "warn",
		"jsx-a11y/anchor-is-valid": "warn",
		"jsx-a11y/click-events-have-key-events": "warn",
		"jsx-a11y/href-no-hash": "warn",
		"jsx-a11y/img-has-alt": "warn", // ??rule removed and causing warnings at the top of every file
		"jsx-a11y/img-redundant-alt": "warn",
		"jsx-a11y/label-has-associated-control": "off",
		"jsx-a11y/label-has-for": "warn",
		"jsx-a11y/media-has-caption": "warn",
		"jsx-a11y/no-static-element-interactions": "warn",
		"jsx-quotes": "off",
		"key-spacing": "off",
		"keyword-spacing": "off",
		"max-depth": ["warn", 4],
		"max-len": ["warn", 340],
		"max-nested-callbacks": ["warn", 4],
		"no-confusing-arrow": "off",
		"no-continue": "off",
		"no-extra-bind": "warn",
		"no-loop-func": "off",
		"no-mixed-operators": "off",
		"no-multi-assign": "off", /* broken - seems to cause errors in linting */
		"no-nested-ternary": "off",
		"no-param-reassign": "off",
		"no-plusplus": "off",
		"no-restricted-globals": "warn", // triggers on isNan()
		"no-return-assign": "off",
		"no-tabs": "off",
		"no-trailing-spaces": "off",
		"no-underscore-dangle": "off",
		"no-unused-vars": "warn",
		"no-use-before-define": "warn",
		"no-useless-concat": "warn",
		"no-useless-constructor": "warn",
		"no-useless-return": "off",
		"no-var": "warn",
		"object-curly-newline": "off",
		"object-curly-spacing": "off",
		"object-property-newline": "off",
		"object-shorthand": "off",
		"one-var-declaration-per-line": "off",
		"one-var": "warn",
		"operator-assignment": "warn",
		"operator-linebreak": "warn",
		"padded-blocks": "warn",
		"prefer-arrow-callback": "off",
		"prefer-const": "off",
		"prefer-destructuring": "off",
		"prefer-promise-reject-errors": "warn",
		"prefer-template": "off",
		"quote-props": "warn",
		"quotes": "off",
		"radix": "off",
		"react/button-has-type": "warn",
		"react/destructuring-assignment": "off",
		"react/forbid-prop-types": "warn",
		"react/jsx-boolean-value": "warn",
		"react/jsx-closing-bracket-location": "warn",
		"react/jsx-closing-tag-location": "off",
		"react/jsx-curly-spacing": "warn",
		"react/jsx-first-prop-new-line": "off",
		"react/jsx-indent-props": ["warn", "tab"],
		"react/jsx-indent": ["warn", "tab"],
		"react/jsx-max-props-per-line": "off",
		"react/jsx-no-bind": "warn",
		"react/jsx-no-target-blank": "warn",
		"react/jsx-one-expression-per-line": "off",
		"react/jsx-space-before-closing": "warn",
		"react/jsx-tag-spacing": "warn",
		"react/jsx-wrap-multilines": "off",
		"react/no-array-index-key": "off",
		"react/no-array-index-key": "warn",
		"react/no-multi-comp": "warn",
		"react/no-unescaped-entities": "warn",
		"react/no-unused-state": "warn",
		"react/prefer-stateless-function": "warn",
		"react/prop-types": "off",
		"react/self-closing-comp": "warn",
		"react/sort-comp": "warn",
		"space-before-blocks": "warn",
		"space-before-function-paren": "off",
		"space-comment": "off",
		"space-in-parens": "off",
		"space-infix-ops": "off",
		"space-unary-ops": "off",
		"spaced-comment": "off",
		"vars-on-top": "warn",
	},
	"globals": {
		"window": true,
		"document": true,
	}
};