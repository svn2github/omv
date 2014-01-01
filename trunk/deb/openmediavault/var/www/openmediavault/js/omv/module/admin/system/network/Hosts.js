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

/**
 * @class OMV.module.admin.system.network.Hosts
 * @derived OMV.workspace.grid.Panel
 */
Ext.define("OMV.module.admin.system.network.Hosts", {
	extend: "OMV.workspace.form.Panel",

	rpcService: "Network",
	rpcGetMethod: "getHostAccessControl",
	rpcSetMethod: "setHostAccessControl",

	getFormItems: function() {
		return [{
			xtype: "fieldset",
			title: _("Host access control"),
			fieldDefaults: {
				labelSeparator: ""
			},
			items: [{
				xtype: "textarea",
				name: "hostacallow",
				fieldLabel: _("Allow"),
				allowBlank: true,
				height: 150
			},{
				xtype: "textarea",
				name: "hostacdeny",
				fieldLabel: _("Deny"),
				allowBlank: true,
				height: 150
			}]
		}];
	}
});

OMV.WorkspaceManager.registerPanel({
	id: "hosts",
	path: "/system/network",
	text: _("Hosts"),
	position: 50,
	className: "OMV.module.admin.system.network.Hosts"
});
