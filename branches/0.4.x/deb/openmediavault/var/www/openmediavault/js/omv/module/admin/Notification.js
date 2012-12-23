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
// require("js/omv/NavigationPanel.js")
// require("js/omv/MessageBox.js")
// require("js/omv/FormPanelExt.js")
// require("js/omv/form/PasswordField.js")
// require("js/omv/form/plugins/FieldInfo.js")

Ext.ns("OMV.Module.System");

// Register the menu.
OMV.NavigationPanelMgr.registerMenu("system", "notification", {
	text: _("Mail Notification"),
	icon: "images/mail.png",
	position: 40
});

/**
 * @class OMV.Module.System.Notification
 * @derived OMV.FormPanelExt
 */
OMV.Module.System.Notification = function(config) {
	var initialConfig = {
		rpcService: "Email"
	};
	Ext.apply(initialConfig, config);
	OMV.Module.System.Notification.superclass.constructor.call(this,
	  initialConfig);
};
Ext.extend(OMV.Module.System.Notification, OMV.FormPanelExt, {
	initComponent : function() {
		OMV.Module.System.Notification.superclass.initComponent.apply(
		  this, arguments);
		this.on("load", function(c, values) {
			// Update the 'Send test email' button.
			this.setButtonDisabled("test", !values.enable);
			// Update the form fields.
			this._updateFormFields();
		}, this);
	},

	getButtons : function() {
		var result = OMV.Module.System.Notification.superclass.
		  getButtons.call(this);
		// Add 'Send test email' button
		result.push({
			id: this.getId() + "-test",
			text: _("Send test email"),
			disabled: true,
			handler: function() {
				// Is the form valid?
				if (!this.isValid()) {
					this.markInvalid();
				} else {
					// Display waiting dialog
					OMV.MessageBox.wait(null, _("Sending test email ..."));
					// Execute RPC
					OMV.Ajax.request(function(id, response, error) {
						OMV.MessageBox.updateProgress(1);
						OMV.MessageBox.hide();
						if (error === null) {
							OMV.MessageBox.success(null, _("The test email has been sent successfully. Please check your mailbox."));
						} else {
							OMV.MessageBox.error(null, error);
						}
					}, this, this.rpcService, "sendTestEmail");
				}
			},
			scope: this
		});
		return result;
	},

	getFormItems : function() {
		return [{
			xtype: "fieldset",
			title: _("General settings"),
			defaults: {
//				anchor: "100%",
				labelSeparator: ""
			},
			items: [{
				xtype: "checkbox",
				name: "enable",
				fieldLabel: _("Enable"),
				checked: false,
				inputValue: 1,
				listeners: {
					check: function(comp, checked) {
						this._updateFormFields();
					},
					scope: this
				}
			}]
		},{
			xtype: "fieldset",
			title: _("SMTP settings"),
			defaults: {
//				anchor: "100%",
				labelSeparator: ""
			},
			items: [{
				xtype: "textfield",
				name: "server",
				fieldLabel: _("SMTP server"),
				allowBlank: false,
				vtype: "domainnameIPv4",
				plugins: [ OMV.form.plugins.FieldInfo ],
				infoText: _("Outgoing SMTP mail server address, e.g. smtp.mycorp.com.")
			},{
				xtype: "numberfield",
				name: "port",
				fieldLabel: _("SMTP port"),
				allowBlank: false,
				allowDecimals: false,
				allowNegative: false,
				vtype: "port",
				value: 25,
				plugins: [ OMV.form.plugins.FieldInfo ],
				infoText: _("The default SMTP mail server port, e.g. 25 or 587.")
			},{
				xtype: "checkbox",
				name: "tls",
				fieldLabel: _("Use SSL/TLS secure connection"),
				checked: false,
				inputValue: 1
			},{
				xtype: "textfield",
				name: "sender",
				fieldLabel: _("Sender"),
				allowBlank: false,
				vtype: "email"
			},{
				xtype: "checkbox",
				name: "authenable",
				fieldLabel: _("Authentication required"),
				checked: false,
				inputValue: 1,
				listeners: {
					check: function(comp, checked) {
						this._updateFormFields();
					},
					scope: this
				}
			},{
				xtype: "textfield",
				name: "username",
				fieldLabel: _("Username"),
				allowBlank: true
			},{
				xtype: "passwordfield",
				name: "password",
				fieldLabel: _("Password"),
				allowBlank: true
			}]
		},{
			xtype: "fieldset",
			title: _("Recipient"),
			defaults: {
//				anchor: "100%",
				labelSeparator: ""
			},
			items: [{
				xtype: "textfield",
				name: "primaryemail",
				fieldLabel: _("Primary email"),
				allowBlank: false,
				vtype: "email"
			},{
				xtype: "textfield",
				name: "secondaryemail",
				fieldLabel: _("Secondary email"),
				allowBlank: true,
				vtype: "email"
			}]
		}];
	},

	/**
	 * Private function to update the states of various form fields.
	 */
	_updateFormFields : function() {
		var enable = this.findFormField("enable").checked;
		// Update authentication fields
		var authenable = this.findFormField("authenable").checked;
		var fields = [ "username", "password" ];
		for (var i = 0; i < fields.length; i++) {
			var c = this.findFormField(fields[i]);
			if (!Ext.isEmpty(c)) {
				c.setReadOnly(!authenable);
				c.allowBlank = !(enable && authenable);
			}
		}
		// Update primary email field
		fields = [ "primaryemail", "server", "sender" ];
		for (var i = 0; i < fields.length; i++) {
			var c = this.findFormField(fields[i]);
			if (!Ext.isEmpty(c)) {
				if (c.xtype === "textfield") {
					c.allowBlank = !enable;
				}
			}
		}
	}
});
OMV.NavigationPanelMgr.registerPanel("system", "notification", {
	cls: OMV.Module.System.Notification
});
