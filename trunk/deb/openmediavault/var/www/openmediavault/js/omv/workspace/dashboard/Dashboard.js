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
 * Display the child nodes of a workspace category in a data view.
 * @class OMV.workspace.dashboard.Dashboard
 * @derived Ext.dashboard.Dashboard
 */
Ext.define("OMV.workspace.dashboard.Dashboard", {
	extend: "Ext.dashboard.Dashboard",
	alias: "widget.workspace.dashboard.panel",
	requires: [
		"Ext.menu.Menu"
	],

	stateful: true,
	stateId: "68f8e3e8-c288-11e4-98d4-0002b3a176b4",
	columnWidths: [
		0.33,
		0.33
	],

	initComponent: function() {
		var me = this;
		// Initialize the top toolbar.
		me.dockedItems = [];
		me.dockedItems.push(me.topToolbar = Ext.widget({
			xtype: "toolbar",
			dock: "top",
			items: me.getTopToolbarItems(me)
		}));
		// Setup the dashboard widgets that can be displayed.
		var aliases = me.getWidgetAliases();
		var parts = {};
		Ext.Array.each(aliases, function(alias) {
			var widget = Ext.create(alias);
			if (!Ext.isObject(widget) || !widget.isDashboardWidget)
				return;
			var type = widget.getType();
			parts[type] = {
				viewTemplate: {
					frame: false,
					icon: widget.icon,
					iconCls: Ext.baseCSSPrefix + "workspace-dashboard-widget-icon",
                    title: widget.title,
                    items: [{
                        xtype: widget.xtype
                    }]
                }
			};
		}, me);
		me.setParts(parts);
		me.callParent(arguments);
	},

	getWidgetAliases: function() {
		return [];
	},

	getTopToolbarItems: function(c) {
		var me = this;
		var items = [];
		var menu = Ext.create("Ext.menu.Menu", {
			defaults: {
				iconCls: Ext.baseCSSPrefix + "menu-item-icon-16x16"
			},
			listeners: {
				scope: me,
				click: function(menu, item, e, eOpts) {
					this.addNew(item.type);
				}
			}
		});
		// Get the registered dashboard widget aliases and fill up the
		// menu which displayes the available dashboard widgets.
		var aliases = me.getWidgetAliases();
		Ext.Array.each(aliases, function(alias) {
			var widget = Ext.create(alias);
			if (!Ext.isObject(widget) || !widget.isDashboardWidget)
				return;
			menu.add({
				text: widget.title,
				icon: widget.icon,
				type: widget.getType()
			});
		});
		// Insert the combobox showing all registered dashboard widgets.
		Ext.Array.insert(items, 0, [{
			id: me.getId() + "-add",
			text: _("Add"),
			icon: "images/add.png",
			menu: menu
		}]);
		return items;
	},

	/**
	 * Initializes the state of the object upon construction.
	 */
	initState: function() {
		var me = this;
		me.callParent(arguments);
		// Check if the dashboard is displayed the first time. If this
		// is the case, then automatically display some widgets by default.
		var id = me.getStateId();
		var state = Ext.state.Manager.get(id);
		if (!(Ext.isDefined(state) && Ext.isObject(state))) {
			// Get all registered dashboard widgets.
			var aliases = me.getWidgetAliases();
			Ext.Array.each(aliases, function(alias) {
				var widget = Ext.create(alias);
				if (!Ext.isObject(widget) || !widget.isDashboardWidget)
					return;
				// Show the widget at startup (e.g. displaying the UI the
				// first time or clearing the cookie)?
				if (!widget.showAtFirstStartup)
					return;
				this.addNew(widget.getType());
			}, me);
		}
	}
});
