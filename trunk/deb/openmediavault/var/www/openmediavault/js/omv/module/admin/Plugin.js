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
// require("js/omv/data/DataProxy.js")
// require("js/omv/data/Store.js")
// require("js/omv/grid/TBarGridPanel.js")
// require("js/omv/UploadDialog.js")
// require("js/omv/util/Format.js")

Ext.ns("OMV.Module.System");

// Register the menu.
OMV.NavigationPanelMgr.registerMenu("system", "plugins", {
	text: "Plugins",
	icon: "images/plugin.png",
	position: 90
});

/**
 * @class OMV.Module.System.PluginGridPanel
 * @derived OMV.grid.TBarGridPanel
 */
OMV.Module.System.PluginGridPanel = function(config) {
	var initialConfig = {
		hidePagingToolbar: true,
		hideAdd: true,
		hideEdit: true,
		deletionWaitMsg: "Uninstalling selected plugin",
		stateId: "2bd3835f-56c4-4047-942b-7d7b5163de2a",
		colModel: new Ext.grid.ColumnModel({
			columns: [{
				header: "Installed",
				sortable: true,
				dataIndex: "installed",
				id: "installed",
				renderer: OMV.util.Format.booleanIconRenderer(),
				fixed: true,
				menuDisabled: true,
				width: 60,
				align: "center"
			},{
				header: "Name",
				sortable: true,
				dataIndex: "name",
				id: "name"
			},{
				header: "Version",
				sortable: true,
				dataIndex: "version",
				id: "version",
				fixed: true,
				width: 140
			},{
				header: "Description",
				sortable: true,
				dataIndex: "description",
				id: "description",
				renderer: OMV.util.Format.whitespaceRenderer()
			}]
		})
	};
	Ext.apply(initialConfig, config);
	OMV.Module.System.PluginGridPanel.superclass.constructor.call(this,
	  initialConfig);
};
Ext.extend(OMV.Module.System.PluginGridPanel, OMV.grid.TBarGridPanel, {
	initComponent : function() {
		this.store = new OMV.data.Store({
			autoLoad: true,
			remoteSort: false,
			proxy: new OMV.data.DataProxy("Plugin", "getList"),
			reader: new Ext.data.JsonReader({
				idProperty: "name",
				totalProperty: "total",
				root: "data",
				fields: [
					{ name: "_readOnly" },
					{ name: "name" },
					{ name: "version" },
					{ name: "description" },
					{ name: "installed" }
    			]
			})
		});
		OMV.Module.System.PluginGridPanel.superclass.initComponent.apply(
		  this, arguments);
		// Change the 'Del' button text.
		this.getTopToolbar().get(this.getId() + "-delete").text = "Uninstall";
	},

	initToolbar : function() {
		var tbar = OMV.Module.System.PluginGridPanel.superclass.initToolbar.apply(
		  this);
		tbar.insert(0, {
			id: this.getId() + "-check",
			xtype: "button",
			text: "Check",
			icon: "images/reload.png",
			handler: this.cbCheckBtnHdl,
			scope: this
		});
		tbar.insert(1, {
			id: this.getId() + "-upload",
			xtype: "button",
			text: "Upload",
			icon: "images/upload.png",
			handler: this.cbUploadBtnHdl,
			scope: this
		});
		tbar.insert(2, {
			id: this.getId() + "-install",
			xtype: "button",
			text: "Install",
			icon: "images/add.png",
			handler: this.cbInstallBtnHdl,
			scope: this,
			disabled: true
		});
		return tbar;
	},

	cbSelectionChangeHdl : function(model) {
		OMV.Module.System.PluginGridPanel.superclass.cbSelectionChangeHdl.apply(
		  this, arguments);
		var records = model.getSelections();
		var tbarInstallCtrl = this.getTopToolbar().findById(this.getId() +
		  "-install");
		if (records.length <= 0) {
			tbarInstallCtrl.disable();
		} else if (records.length == 1) {
			tbarInstallCtrl.enable();
		} else {
			tbarInstallCtrl.disable();
		}
	},

	cbCheckBtnHdl : function() {
		OMV.MessageBox.wait(null, "Checking for new plugins ...");
		OMV.Ajax.request(function(id, response, error) {
			  if (error !== null) {
				  OMV.MessageBox.hide();
				  OMV.MessageBox.error(null, error);
			  } else {
				  this.cmdId = response;
				  OMV.Ajax.request(this.cbIsRunningHdl, this, "Exec",
					"isRunning", [ this.cmdId ]);
			  }
		  }, this, "Apt", "update");
	},

	cbIsRunningHdl : function(id, response, error) {
		if (error !== null) {
			delete this.cmdId;
			OMV.MessageBox.hide();
			OMV.MessageBox.error(null, error);
		} else {
			if (response === true) {
				(function() {
				  OMV.Ajax.request(this.cbIsRunningHdl, this, "Exec",
					"isRunning", [ this.cmdId ]);
				}).defer(500, this);
			} else {
				delete this.cmdId;
				OMV.MessageBox.hide();
				this.doReload();
			}
		}
	},

	cbUploadBtnHdl : function() {
		var wnd = new OMV.UploadDialog({
			title: "Upload plugin",
			service: "Plugin",
			method: "upload",
			listeners: {
				success: function(wnd, response) {
					// The upload was successful, now resynchronize the
					// package index files from their sources.
					this.cbCheckBtnHdl();
				},
				scope: this
			}
		});
		wnd.show();
	},

	cbInstallBtnHdl : function() {
		var selModel = this.getSelectionModel();
		var record = selModel.getSelected();
		var wnd = new OMV.ExecCmdDialog({
			title: "Install plugins ...",
			rpcService: "Plugin",
			rpcMethod: "install",
			rpcArgs: record.get("name"),
			hideStart: true,
			hideStop: true,
			killCmdBeforeDestroy: false,
			listeners: {
				finish: function(wnd, response) {
					wnd.appendValue("\nDone ...");
					wnd.setButtonDisabled("close", false);
				},
				exception: function(wnd, error) {
					OMV.MessageBox.error(null, error);
					wnd.setButtonDisabled("close", false);
				},
				close: function() {
					this.doReload();
					OMV.MessageBox.info(null, "Please reload the page to " +
					  "let the changes take effect.");
				},
				scope: this
			}
		});
		wnd.setButtonDisabled("close", true);
		wnd.show();
		wnd.start();
	},

	/**
	 * @method doDeletion
	 * Delete the selected plugin.
	 */
	doDeletion : function(record) {
		OMV.Ajax.request(this.cbDeletionHdl, this, "Plugin", "remove",
		  [ record.get("name") ]);
	},

	/**
	 * @method afterDeletion
	 * Reload the grid and display a message box to notify the user to
	 * reload the page (otherwise the currently removed code is called
	 * when activated).
	 */
	afterDeletion : function() {
		this.doReload();
		OMV.MessageBox.info(null, "Please reload the page to let the " +
		  "changes take effect.");
	}
});
OMV.NavigationPanelMgr.registerPanel("system", "plugins", {
	cls: OMV.Module.System.PluginGridPanel
});
