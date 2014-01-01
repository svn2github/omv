/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2014 Volker Theile
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
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

/**
 * @class OMV.module.admin.service.owncloud.Settings
 * @derived OMV.workspace.form.Panel
 */
Ext.define("OMV.module.admin.service.owncloud.Settings", {
	extend: "OMV.workspace.form.Panel",
	requires: [
		"OMV.form.field.SharedFolderComboBox"
	],

	rpcService: "OwnCloud",
 	rpcGetMethod: "getSettings",
	rpcSetMethod: "setSettings",
	plugins: [{
		ptype: "linkedfields",
		correlations: [{
			name: "sharedfolderref",
			conditions: [
				{ name: "enable", value: true }
			],
			properties: "!allowBlank"
		}]
	}],

	getFormItems: function() {
		return [{
			xtype: "fieldset",
			title: _("General settings"),
			fieldDefaults: {
				labelSeparator: ""
			},
			items: [{
				xtype: "checkbox",
				name: "enable",
				fieldLabel: _("Enable"),
				checked: false
			},{
				xtype: "sharedfoldercombo",
				name: "sharedfolderref",
				fieldLabel: _("Data directory"),
				allowNone: true,
				plugins: [{
					ptype: "fieldinfo",
					text: _("The location where ownCloud stores its files.")
				}]
			}]
		}];
	}
});

OMV.WorkspaceManager.registerPanel({
	id: "settings",
	path: "/service/owncloud",
	text: _("Settings"),
	position: 10,
	className: "OMV.module.admin.service.owncloud.Settings"
});
