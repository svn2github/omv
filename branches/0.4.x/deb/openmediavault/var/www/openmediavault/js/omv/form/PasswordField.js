/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
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

Ext.ns("OMV.form");

/**
 * @class OMV.form.PasswordField
 * @derived Ext.form.TriggerField
 */
OMV.form.PasswordField = function(config) {
	var initialConfig = {
		defaultAutoCreate: {
			"tag": "input",
			"type": "password",
			"size": "20",
			"autocomplete": "off"
		},
		triggerConfig: {
			"tag": "img",
			"src": Ext.BLANK_IMAGE_URL,
			"alt": "",
			"cls": "x-form-trigger x-form-password-trigger",
			"ext:qtip": _("Show password")
		}
	};
	Ext.apply(initialConfig, config);
	OMV.form.PasswordField.superclass.constructor.call(this, initialConfig);
};
Ext.extend(OMV.form.PasswordField, Ext.form.TriggerField, {
	onTriggerClick : function() {
		if(this.disabled) {
			return;
		}
		var el = this.getEl();
		if(!Ext.isIE) {
			// Firefox, Chrome, ... can change the field type dynamically.
			el.dom.type = (el.dom.type == "text") ? "password" : "text";
		} else {
			// Windows IE is not able to change the type dynamically, thus
			// a new HTML element must be created.
			var newEl = document.createElement("input");
			newEl.type = (el.dom.type == "text") ? "password" : "text";
			// Copy various attributes from the origin object.
			if(el.dom.value) newEl.value = el.dom.value;
			if(el.dom.name) newEl.name = el.dom.name;
			if(el.dom.id) newEl.id = el.dom.id;
			if(el.dom.className) newEl.className = el.dom.className;
			if(el.dom.readOnly) newEl.readOnly = el.dom.readOnly;
			if(el.dom.style.width) newEl.style.width = el.dom.style.width;
			el.replaceWith(newEl);
		}
	}
});
Ext.reg("passwordfield", OMV.form.PasswordField);
