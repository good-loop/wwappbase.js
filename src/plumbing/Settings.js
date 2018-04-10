'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * User settings, sometimes inferred from the browser
 */

var Settings = {};
exports.default = Settings;


if (navigator) {
  if (navigator.languages && navigator.languages.length) Settings.locale = navigator.languages[0];else Settings.locale = navigator.language;
}
// provide a default, 'cos otherwise NumberFormat gets upset
if (!Settings.locale) Settings.locale = 'en-GB';