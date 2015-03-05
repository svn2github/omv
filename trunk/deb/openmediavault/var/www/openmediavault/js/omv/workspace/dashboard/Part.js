/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2015 Volker Theile
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

/**
 * @class OMV.workspace.dashboard.Part
 * @derived Ext.dashboard.Part
 * @param showAtFirstStartup Set to TRUE to display the widget by default
 *   if the dashboard panel is displayed the first time or the cookie has
 *   been cleared. Defaults to FALSE.
 */
Ext.define("OMV.workspace.dashboard.Part", {
	extend: "Ext.dashboard.Part",

	config: {
		icon: "",
		title: "",
		viewXType: "",
		showAtFirstStartup: false
	},

	constructor: function(config) {
		var me = this;
		me.callParent([ config ]);
		me.setConfig("viewTemplate", me.buildViewTemplate());
	},

	buildViewTemplate: function() {
		var me = this;
		return {
			frame: false,
			icon: me.getIcon(),
			iconCls: Ext.baseCSSPrefix + "workspace-dashboard-widget-icon",
			title: me.getTitle(),
			items: [{
				xtype: me.getViewXType()
			}]
		}
	},

	/**
	 * Helper function to generate a type ID based on the alias name.
	 * This is used by the Ext.dashboard.Dashboard 'parts' config.
	 * @private
	 * @return The type ID.
	 */
	getType: function() {
		var me = this;
		var type = me.alias[0];
		return type.replace(/\./g, "");
	}
});
