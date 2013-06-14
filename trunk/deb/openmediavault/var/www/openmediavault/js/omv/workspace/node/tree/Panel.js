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
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/node/tree/Model.js")

/**
 * @ingroup webgui
 * @class OMV.workspace.node.tree.Panel
 * @derived Ext.tree.Panel
 */
Ext.define("OMV.workspace.node.tree.Panel", {
	extend: "Ext.tree.Panel",
	alias: "widget.workspacenodetree",
	requires: [
		"OMV.workspace.node.tree.Model"
	],
	uses: [
		"OMV.WorkspaceManager"
	],

	constructor: function(config) {
		var me = this;
		config = Ext.apply({
			store: Ext.create("Ext.data.TreeStore", {
				model: "OMV.workspace.node.tree.Model",
				root: {
					expanded: true,
					node: null,
					text: "root",
					children: []
				},
				sorters: [{
					sorterFn: function(a, b) {
						var getPosition = function(o) {
							var node = o.get("node");
							return node.getPosition();
						};
						return getPosition(a) < getPosition(b) ? -1 : 1;
					}
				}]
			}),
			rootVisible: false
		}, config || {});
		me.callParent([ config ]);
	},

	initComponent: function() {
		var me = this;
		var root = me.getRootNode();
		OMV.WorkspaceManager.getRootNode().eachChild(function(node) {
			var treeNode = {
				text: node.getText(),
				node: node,
				leaf: node.isLeaf(),
				children: []
			};
			if(node.hasChildNodes()) {
				Ext.apply(treeNode, {
					cls: "folder",
					expanded: true
				});
			}
			if(node.hasIcon("raster16")) {
				Ext.apply(treeNode, {
					icon: node.getIcon16(),
					iconCls: !node.hasIcon("svg") ? null :
					  Ext.baseCSSPrefix + "tree-icon-16x16"
				});
			}
			node.eachChild(function(childNode) {
				var treeChildNode = {
					text: childNode.getText(),
					leaf: true,
					node: childNode,
					icon: childNode.getIcon16(),
					iconCls: !childNode.hasIcon("svg") ? null :
					  Ext.baseCSSPrefix + "tree-icon-16x16"
				};
				treeNode.children.push(treeChildNode);
			});
			root.appendChild(treeNode);
		});
		me.callParent(arguments);
	},

	afterRender: function() {
		var me = this;
		me.callParent(arguments);
		// Select the 'About' or 'System Information' menu entry per
		// default after login.
		me.getRootNode().cascadeBy(function(treeNode) {
			var node = treeNode.get("node");
			if(!Ext.isObject(node) || !node.isNode)
				return;
			var path = node.getPath();
			var id = node.getId();
			if(((path === "/info/about") && (id === "about")) ||
			  ((path === "/diagnostic") && (id === "system"))) {
				// Select the found node delayed to ensure the components
				// are already rendered (especially the toolbar displaying
				// the path of the selected node). Maybe not the best
				// solution but it works at the moment.
				Ext.Function.defer(function() {
					this.getSelectionModel().select(treeNode);
				}, 500, me);
				return false;
			}
		});
	}
});
