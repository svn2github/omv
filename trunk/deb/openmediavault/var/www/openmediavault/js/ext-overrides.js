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

////////////////////////////////////////////////////////////////////////////////
// Ext.form.field.VTypes
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.form.field.VTypes, {
	IPv4: function(v) {
		return /^([1-9][0-9]{0,1}|1[013-9][0-9]|12[0-689]|2[01][0-9]|22[0-3])([.]([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2}[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-4])$/.test(v);
	},
	IPv4Text: _("This field should be an IPv4 address"),
	IPv4Mask: /[\d\.]/i,

	IPv4List:  function(v) {
		var valid = true;
		// Split string into several IPv4 addresses.
		Ext.each(v.split(/[,;]/), function(ip) {
			// Is it a valid IPv4 address?
			if(!Ext.form.field.VTypes.IPv4(ip)) {
				valid = false;
				return false;
			}
		});
		return valid;
	},
	IPv4ListText: "This field should be a list of IPv4 addresses",
	IPv4ListMask: /[\d\.,;]/i,

	IPv4Net: function(v) {
		return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
	},
	IPv4NetText: _("This field should be a IPv4 network address"),
	IPv4NetMask: /[\d\.\/]/i,

	IPv4NetCIDR: function(v) {
		return /^([0-9][0-9]{0,1}|1[013-9][0-9]|12[0-689]|2[01][0-9]|22[0-3])([.]([0-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2}[.]([0-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-4])\/(3[0-2]|[0-2]?[0-9])$/.test(v);
	},
	IPv4NetCIDRText: _("This field should be a IPv4 network address in CIDR notation"),
	IPv4NetCIDRMask: /[\d\.\/]/i,

	IPv4Fw: function(v) {
		ipv4RegEx = "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}";
		if(v === "0/0")
			return true;
		// 172.16.76.4 or !192.168.178.87/24
		if(RegExp("^(!)?("+ipv4RegEx+")(\/(3[0-2]|[0-2]?\\d))?$", "i").test(v))
			return true;
		// 192.168.178.20-192.168.178.254
		return RegExp("^(!)?(("+ipv4RegEx+")([-]("+ipv4RegEx+")){0,1})$", "i").test(v);
	},
	IPv4FwText: _("This field should be either a IPv4 network address (with /mask), a IPv4 range or a plain IPv4 address (e.g. 172.16.76.4 or !192.168.178.87/24 or 192.168.178.20-192.168.178.254)"),
	IPv4FwMask: /[\d\.\/\-:!]/i,

	IPv6: function(v) {
		// Taken from http://home.deds.nl/~aeron/regex
		return /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i.test(v);
	},
	IPv6Text: _("This field should be an IPv6 address"),
	IPv6Mask: /[0-9A-F:]/i,

	netmask: function(v) {
		return /^(128|192|224|24[08]|25[245].0.0.0)|(255.(0|128|192|224|24[08]|25[245]).0.0)|(255.255.(0|128|192|224|24[08]|25[245]).0)|(255.255.255.(0|128|192|224|24[08]|252))$/.test(v);
	},
	netmaskText: _("This field should be a netmask within the range 128.0.0.0 - 255.255.255.252"),
	netmaskMask: /[.0-9]/,

	port: function(v) {
		return /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(v);
	},
	portText: _("This field should be a port in the range of 1 - 65535"),
	portMask: /[0-9]/i,

	portFw: function(v) {
		var portRegEx = "[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]";
		return RegExp("^!?(("+portRegEx+")([-:]("+portRegEx+")){0,1})$", "i").test(v);
	},
	portFwText: _("This field should be a port or port range (e.g. 21 or !443 or 1024-65535)"),
	portFwMask: /[0-9\-:!]/i,

	num: function(v) {
		return /^[0-9]+$/.test(v);
	},
	numText: _("This field should only contain numbers"),
	numMask: /[0-9]/i,

	numList: function(v) {
		return /^(\d+[,;])*\d+$/.test(v);
	},
	numListText: _("This field should only contain numbers seperated by <,> or <;>"),
	numListMask: /[\d,;]/i,

	textList: function(v) {
		return /^(\w+[,;])*\w+$/.test(v);
	},
	textListText: _("This field should only contain strings seperated by <,> or <;>"),
	textListMask: /[\w,;]/i,

	portList: function(v) {
		return /^((0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])[,;])*(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(v);
	},
	portListText: _("This field should only contain ports (0 - 65535) seperated by <,> or <;>"),
	portListMask: /[\d,;]/i,

	hostname: function(v) {
		return /^[a-zA-Z]([-a-zA-Z0-9]{0,61}[a-zA-Z0-9]){0,1}$/.test(v);
	},
	hostnameText: _("Invalid hostname"),
	hostnameMask: /[a-z0-9\-]/i,

	hostnameIPv4: function(v) {
		if(Ext.form.field.VTypes.hostname(v))
			return true;
		if(Ext.form.field.VTypes.IPv4(v))
			return true;
		return false;
	},
	hostnameIPv4Text: _("This field should be a hostname or an IPv4 address"),
	hostnameIPv4Mask: /[a-z0-9\-\.]/i,

	domainname: function(v) {
		// See http://shauninman.com/archive/2006/05/08/validating_domain_names
		return /^[a-zA-Z0-9]([-a-zA-Z0-9]{0,61}[a-zA-Z0-9])?([.][a-zA-Z0-9]([-a-zA-Z0-9]{0,61}[a-zA-Z0-9])?)*$/.test(v);
	},
	domainnameText: _("Invalid domain name"),
	domainnameMask: /[a-z0-9\-\.]/i,

	domainnameIPv4: function(v) {
		if(Ext.form.field.VTypes.domainname(v))
			return true;
		if(Ext.form.field.VTypes.IPv4(v))
			return true;
		return false;
	},
	domainnameIPv4Text: _("This field should be a domainname or an IPv4 address"),
	domainnameIPv4Mask: /[a-z0-9\-\.]/i,

	groupname: function(v) {
		return /^[a-zA-Z0-9\-\.]+$/.test(v);
	},
	groupnameText: _("Invalid group name"),
	groupnameMask: /[a-zA-Z0-9\-\.]/,

	username: function(v) {
		// Taken from Debian adduser
		return /^[_.A-Za-z0-9][-\@_.A-Za-z0-9]*\$?$/.test(v);
	},
	usernameText: _("Invalid user name"),
	usernameMask: /[-\@_.A-Za-z0-9]/,

	comment: function(v) {
		return !/["':]/.test(v);
	},
	commentText: _("The comment contains invalid characters"),
	commentMask: /[^"':]/,

	password: function(v) {
		return !/[^a-zA-Z0-9\.\-_]/.test(v);
	},
	passwordText: _("The password contains invalid characters"),
	passwordMask: /[a-zA-Z0-9\.\-_]/,

	// String that are used as filesystem label
	fslabel: function(v) {
		return /^[a-zA-Z0-9]+$/.test(v);
	},
	fslabelText: _("Invalid filesystem label"),
	fslabelMask: /[a-zA-Z0-9]/,

	sharename: function(v) {
		// We are using the SMB/CIFS file/directory naming convention for this:
		// All characters are legal in the basename and extension except the
		// space character (0x20) and:
		// "./\[]:+|<>=;,*?
		// A share name or server or workstation name SHOULD not begin with a
		// period (“.”) nor should it include two adjacent periods (“..”).
		// References:
		// http://tools.ietf.org/html/draft-leach-cifs-v1-spec-01
		// http://msdn.microsoft.com/en-us/library/aa365247%28VS.85%29.aspx
		return /^[^.]([^"/\\\[\]:+|<>=;,*?. ]+){0,1}([.][^"/\\\[\]:+|<>=;,*?. ]+){0,}$/.test(v);
	},
	sharenameText: "This field contains invalid characters, e.g. space character or \"/\[]:+|<>=;,*?",
	sharenameMask: /[^"/\\\[\]:+|<>=;,*? ]/,

	// Strings that are used as part of a device name
	devname: function(v) {
		return /^[a-zA-Z0-9\.\-_]+$/.test(v);
	},
	devnameText: _("Invalid name"),
	devnameMask: /[a-zA-Z0-9\.\-_]/,

	noBlank: function(v) {
		return !/[ ]+/.test(v);
	},
	noBlankText: _("This field does not allow blanks"),
	noBlankMask: /[^ ]/i
});

////////////////////////////////////////////////////////////////////////////////
// Ext.LoadMask
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.LoadMask.prototype, {
	msg: _("Loading ...")
});

////////////////////////////////////////////////////////////////////////////////
// Ext.window.MessageBox
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.window.MessageBox, {
	buttonText: {
		ok: _("OK"),
		cancel: _("Cancel"),
		yes: _("Yes"),
		no: _("No")
	}
});

////////////////////////////////////////////////////////////////////////////////
// Ext.data.Store
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.data.Store.prototype, {
	dirty: false,

	markDirty: function() {
		this.dirty = true;
	},

	isDirty: function() {
		return this.dirty;
	},

	isLoaded: function() {
		var me = this;
		// Note, this method may be incorrect in some cases, but in
		// most cases the following indications should be suitable to
		// find out whether a store has been loaded or not.
		if(me.isLoading())
			return false;
		if(Ext.isDefined(me.totalCount))
			return true;
		if(Ext.isDefined(me.lastOptions))
			return true;
		// Note, if the store has been loaded but no content has been
		// received the following test returns an incorrect result.
		if(me.getCount() > 0)
			return true;
		return false;
	}
});

// Fix modified issue when adding, inserting or removing records from a store.
Ext.Function.interceptAfter(Ext.data.Store.prototype, "insert",
  function(index, records) {
	this.markDirty();
});
Ext.Function.interceptAfter(Ext.data.Store.prototype, "add",
  function(records) {
	this.markDirty();
});
Ext.Function.interceptAfter(Ext.data.Store.prototype, "remove",
  function(records) {
	this.markDirty();
});
Ext.Function.interceptAfter(Ext.data.Store.prototype, "afterEdit",
  function(record) {
	var me = this, recs = me.getModifiedRecords();
	if(recs.length > 0)
		me.markDirty();
});
Ext.Function.interceptAfter(Ext.data.Store.prototype, "rejectChanges",
  function() {
	this.dirty = false;
});
Ext.Function.interceptAfter(Ext.data.Store.prototype, "commitChanges",
  function() {
	this.dirty = false;
});

////////////////////////////////////////////////////////////////////////////////
// Ext.state.CookieProvider
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.state.CookieProvider.prototype, {
	/**
	 * Clear all states.
	 */
	clearAll: function() {
		var me = this;
		var cookie = document.cookie + ";";
		var re = /\s?(.*?)=(.*?);/g;
		var matches;
		var prefix = me.prefix;
		var len = prefix.length;
		while(null != (matches = re.exec(cookie))) {
			var name = matches[1];
			if(name && name.substring(0, len) == prefix) {
				this.clear(name.substr(len));
			}
		}
	}
});

////////////////////////////////////////////////////////////////////////////////
// Ext.form.field.Field
////////////////////////////////////////////////////////////////////////////////

// Do not reset a form field that is read-only.
Ext.Function.createInterceptor(Ext.form.field.Field.prototype, "reset",
  function() {
	if(this.readOnly)
		return false;
});

////////////////////////////////////////////////////////////////////////////////
// Ext.form.field.Trigger
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.form.field.Trigger.prototype, {
	getTriggerButtonEl: function(id) {
		var me = this, el = null;
		if(Ext.isNumber(id)) {
			el = me.triggerEl.item(id);
		} else if(Ext.isString(id)) {
			// Search by the given CSS class.
			var selector = Ext.String.format("[class~={0}][role=button]", id);
			el = me.getEl().query(selector)[0];
		}
		return el;
	}
});

////////////////////////////////////////////////////////////////////////////////
// Ext.form.field.ComboBox
////////////////////////////////////////////////////////////////////////////////

Ext.form.field.ComboBox.prototype.setValue = Ext.Function.createInterceptor(
  Ext.form.field.ComboBox.prototype.setValue, function() {
	var me = this;
	// Check if the store has already been loaded. If not, then call this
	// function again after the store has been loaded. Note, if the store
	// is already loading then do nothing, the base implementation will
	// handle this for us.
	// Note, in some situations it occurs that the setValue function is
	// called multiple times before the store has been loaded. To ensure
	// that unfired listeners do not overwrite the value which is
	// successfully set after the store has been loaded it is necessary
	// to remove all of them.
	if(!me.store.isLoading() && !me.store.isLoaded()) {
		var fn = Ext.Function.bind(me.setValue, me, arguments);
		if(!Ext.isDefined(me.setValueListeners))
			me.setValueListeners = [];
		me.setValueListeners.push(fn);
		me.store.on({
			single: true,
			load: fn
		});
		return false;
	}
	// Remove buffered listeners (which have not been fired until now),
	// otherwise they will overwrite the given value.
	if(Ext.isDefined(me.setValueListeners)) {
		Ext.Array.each(me.setValueListeners, function(fn) {
			me.store.un("load", fn)
		});
		delete me.setValueListeners;
	}
});

////////////////////////////////////////////////////////////////////////////////
// Ext.Base
////////////////////////////////////////////////////////////////////////////////

Ext.apply(Ext.Base.prototype, {
	callPrototype: function(methodName, args) {
		var proto = Object.getPrototypeOf(this);
		return proto[methodName].apply(this, args || []);
	}
});

////////////////////////////////////////////////////////////////////////////////
// Additional helper functions
////////////////////////////////////////////////////////////////////////////////

Ext.applyIf(Ext, {
	/**
	 * Copies recursively all the properties of config to obj.
	 * @param o The receiver of the properties
	 * @param c The source of the properties
	 * @param defaults A different object that will also be applied for default values
	 * @return Returns the receiver object.
	 */
	applyEx: function(o, c, defaults) {
		// no "this" reference for friendly out of scope calls
		if(defaults) {
			Ext.apply(o, defaults);
		}
		if(o && c && typeof c == 'object') {
			for(var p in c) {
				if((typeof c[p] == 'object') && (typeof o[p] !== 'undefined')) {
					Ext.applyEx(o[p], c[p]);
				} else {
					o[p] = c[p];
				}
			}
		}
		return o;
	},

	/**
	 * Finds out whether a variable is an UUID v4.
	 * @param value The variable being evaluated.
	 * @return TRUE if variable is a UUID, otherwise FALSE.
	 */
	isUUID: function(value) {
		if(Ext.isEmpty(value) || !Ext.isString(value))
			return false;
		return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
	}
});
