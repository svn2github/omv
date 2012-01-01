/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2012 Volker Theile
 *
 * OpenMediaVault is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * OpenMediaVault is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with OpenMediaVault. If not, see <http://www.gnu.org/licenses/>.
 */

Ext.ns("OMV.util");

/**
 * Reusable data formating functions.
 */
OMV.util.Format = function() {
	f = function() {}
	f.prototype = Ext.util.Format;
	var o = function() {}
	Ext.extend(o, f, function() {
		return {
			/**
			 * @method boolean
			 * Format a boolean value in a string representation.
			 * @param value The boolean value to format
			 * @return The formatted boolean string
			 */
			boolean : function(value) {
				return ((true === value) || (1 == value)) ? "Yes" : "No";
			},

			/**
			 * @method booleanRenderer
			 * Returns a boolean rendering function
			 * @return The boolean rendering function
			 */
			booleanRenderer : function() {
				return function(value) {
					return OMV.util.Format.boolean(value);
				};
			},

			/**
			 * @method booleanIconRenderer
			 * Returns a boolean rendering function which renders an image
			 * @param trueIcon The icon to use, defaults to 'yes.png'
			 * @param falseIcon The icon to use, defaults to 'no.png'
			 * @return The boolean rendering function
			 */
			booleanIconRenderer : function(trueIcon, falseIcon) {
				trueIcon = trueIcon || "yes.png";
				falseIcon = falseIcon || "no.png";
				return function(value) {
					if ((true === value) || (1 == value))
						img = trueIcon;
					else
						img = falseIcon;
					return "<img border='0' src='images/" + img + "' alt='" +
					  OMV.util.Format.boolean(value) + "'>";
				};
			},

			/**
			 * @method arrayRenderer
			 * Returns an array rendering function
			 * @param data The array containing the key/value pairs used to
			 * map the value to be rendered
			 * @return The rendering function
			 */
			arrayRenderer : function(data) {
				return function(value) {
					for (var i = 0; i < data.length; i++) {
						var d = data[i];
						if (d[0] === value) {
							return d[1];
						}
					}
					return value;
				};
			},

			/**
			 * @method localeTimeRenderer
			 * Returns a rendering function that displayes the given
			 * unix epoch timestamp in human readable form using the
			 * local time format.
			 * @return The rendering function
			 */
			localeTimeRenderer : function() {
				return function(value) {
					var dt = Date.parseDate(value, "U");
					return dt.toLocaleString();
				};
			},

			/**
			 * @method whitespace
			 * Format the given value using the defined white-space mode.
			 * @param value The value to format.
			 * @param mode The mode to use. This can be: normal, nowrap, pre,
			 * pre-line, pre-wrap or inherit. Defaults to 'normal'.
			 * @return The HTML code to display the given text using the
			 * given white-space mode.
			 */
			whitespace : function(value, mode) {
				mode = mode || "normal";
				return "<div style='white-space:" + mode + " !important;'>" +
				  value + "</div>";
			},

			/**
			 * @method whitespaceRenderer
			 * Return a rendering function that formats a value using the
			 * defined white-space mode.
			 * @param mode The mode to use. This can be: normal, nowrap, pre,
			 * pre-line, pre-wrap or inherit. Defaults to 'normal'.
			 * @return The rendering function
			 */
			whitespaceRenderer : function(mode) {
				return function(value) {
					return OMV.util.Format.whitespace(value, mode);
				};
			}
		};
	}());
	return new o();
}();
