var m_json_load_callbacks = {};
var m_json_load_elements = {};
var m_json_load_complete_callbacks = [];
var m_json_load_pending_request_count = 0;

// setCapture for Mozilla & Opera
if (window.HTMLElement)
{
	var element = HTMLElement.prototype;

	var custom_capture = false;
	if (typeof element.setCapture == "undefined")
	{
		custom_capture = true;

		var capture = ["click", "mousedown", "mouseup", "mousemove", "mouseover", "mouseout"];

		element.setCapture = function()
		{
			var self = this;
			var flag = false;
			this._capture = function(e)
			{
				if (flag) return;
				flag = true;

				var event = document.createEvent("MouseEvents");
				event.initMouseEvent(e.type, e.bubbles, e.cancelable, e.view, e.detail,
					e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
					e.shiftKey, e.metaKey, e.button, e.relatedTarget);
				self.dispatchEvent(event);
				flag = false;
			};
			for (var i = 0; i < capture.length; i++)
				window.addEventListener(capture[i], this._capture, true);
		};

		element.releaseCapture = function()
		{
			for (var i = 0; i < capture.length; i++) 
				window.removeEventListener(capture[i], this._capture, true);
			this._capture = null;
		};
	}

	element.click = function()
	{
		var event = document.createEvent("MouseEvents");
		event.initMouseEvent("click", false, true, document.defaultView, 
			1, 0, 0, 0, 0, false, false, false, false, 0, this);
		this.dispatchEvent(event);
	}

	if (element.__defineGetter__ && typeof(document.documentElement.uniqueID) == "undefined")
	{
		element.__defineGetter__("uniqueID", function()
		{
			if (!arguments.callee.count) arguments.callee.count = 0;
			var _uniqueID = "moz_id" + arguments.callee.count++;
			this.__defineGetter__("uniqueID", function() { return _uniqueID } );
			return _uniqueID;
		} );
	}

	if (isFF && element.__defineGetter__ && typeof(document.documentElement.innerText) == "undefined")
	{
		element.__defineGetter__("innerText", function() { return this.textContent; } );
		element.__defineSetter__("innerText", function(value) { this.textContent = value; } );
	}

}


m_PointerCursor = "pointer";

String.prototype.trim = function() 
{
	return this.replace(/(^\s*)|(\s*$)/g, "");
}

function _execute(link)
{
	var msg_unableToRun = "Unable to run the Diff utility:\n" + link;
	var msg_unsupported = msg_unableToRun + "\n\n" +
		"This action is only available from Internet Explorer that displays unpacked (non-MHT) log.\n" +
		"You may need to enable the \"Initialize and script ActiveX controls not marked as safe for scripting\" option.";

	if (typeof window.ActiveXObject == "undefined")
	{
		alert(msg_unsupported);
		return false;
	}

	cmd = link.replace(new RegExp("&quot;", "g"), "\"");

	var loc = isIE ? "probably.mht" : "";
	try { loc = window.document.location.href; } catch (e) { }
	var isMHT = (loc.indexOf(".mht") == loc.length - 4);
	loc = unescape(correctLocation(loc, "").replace("file:///", ""));
	if (loc.indexOf("file:") == 0) { loc = loc.substring(5).replace(new RegExp("/", "g"), "\\"); }

	var index = 0;
	var p1 = -1;
	var p2 = -1;
	while (index < 10)
	{
		p1 = cmd.indexOf("\"", p2 + 1); if (p1 < 0) break;
		p2 = cmd.indexOf("\"", p1 + 1); if (p2 < 0) break;
		var path = cmd.substring(p1 + 1, p2);

		var correctPath = (index > 0 && path.indexOf("\\") < 0);

		if (index == 0 || !isMHT)
		{
			try
			{
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var exists = fso.FileExists(correctPath ? loc + path : path);
				fso = null;
			}
			catch (ex)
			{
				alert(msg_unsupported);
				return false;
			}

			if (!exists)
			{
				alert(msg_unableToRun + "\n\nFile " + path + " does not exists.");
				return false;
			}
		}

		if (correctPath)
		{
			if (isMHT)
			{
				alert(msg_unsupported);
				return false;
			}

			cmd = cmd.substring(0, p1 + 1) + loc + cmd.substring(p1 + 1);
			p2 += loc.length;
		}
		
		index++;
	}

	var shell = new ActiveXObject("WScript.Shell");
	shell.Run(cmd);
	shell = null;
	return false;
}

function _load_JSON(url, element, callback, complete_callback)
{
	var moniker = url;
	var p = url.lastIndexOf("\\");
	if (p < 0) p = url.lastIndexOf("/");
	if (p > 0) moniker = url.substring(p + 1);

	m_json_load_pending_request_count++;
	m_json_load_callbacks[moniker] = callback;
	m_json_load_elements[moniker] = element;
	if (complete_callback)
		m_json_load_complete_callbacks.push(complete_callback);

	var script = document.createElement("SCRIPT");
	script.type = 'text/javascript';
	script.id = moniker;
	script.src = url;
	document.body.appendChild(script);
}

function _json_loaded(moniker, data)
{
	var callback = m_json_load_callbacks[moniker];
	if (callback)
		callback(m_json_load_elements[moniker], data);

	document.body.removeChild(document.getElementById(moniker));
	delete m_json_load_callbacks[moniker];
	delete m_json_load_elements[moniker];

	m_json_load_pending_request_count--;
	if (m_json_load_pending_request_count == 0)
	{
		doWindowResize();
		for (var i = 0; i < m_json_load_complete_callbacks.length; i++)
			m_json_load_complete_callbacks[i]();
		m_json_load_complete_callbacks = [];
	}
}

function _load_XML(url)
{
	var oXml;

	if (window.ActiveXObject || isIE11) {
		oXml = new ActiveXObject("Microsoft.XMLDOM");
		oXml.async = false;
		oXml.load(url);
	}
	else if (window.XMLHttpRequest)
	{
		if (isOpera) url = url.toLowerCase();

		var loader = new XMLHttpRequest();
		try
		{
			loader.open("GET", url, false);
		}
		catch(e)
		{
			try { netscape.security.PrivilegeManager.enablePrivilege ("UniversalBrowserRead")} catch (e) {}
			loader.open("GET", url, false);
		}
		if (url.substring(url.length - 3) == "xsd" && typeof(loader.overrideMimeType) != 'undefined')
			loader.overrideMimeType("text/xml");
		try
		{
			loader.send(null);
		}
		catch(e)
		{
			return null;
		}
		oXml = loader.responseXML;
	}

	if (oXml == null || oXml.documentElement == null)
		return null;

	return oXml;
}

function _load_Text(url)
{
	if (window.ActiveXObject || isIE11)
	{
		var loader = new ActiveXObject("MSXML2.XMLHTTP");
		loader.open("GET", url, false);
		loader.send(null);
		return loader.responseText;
	}
	else if (window.XMLHttpRequest)
	{
		if (isOpera) url = url.toLowerCase();

		var loader = new XMLHttpRequest();
		try
		{
			loader.open("GET", url, false);
		}
		catch(e)
		{
			try { netscape.security.PrivilegeManager.enablePrivilege ("UniversalBrowserRead")} catch (e) {}
			loader.open("GET", url, false);
		}
		try
		{
			loader.send(null);
		}
		catch(e)
		{
			return null;
		}

		return loader.responseText;
	}
	else
		return "Cannot read file " + url;
}

function getScreenX(obj)
{
	if (obj.getBoundingClientRect)
		return obj.getBoundingClientRect().left;

	var left = 0;
	if (obj) do
	{
		left += obj.offsetLeft;
		if (!obj.offsetParent) break;
		obj = obj.offsetParent;
	} while (true);

	return left;
}

function getScreenY(obj)
{
	if (obj.getBoundingClientRect)
		return obj.getBoundingClientRect().top;

	var top = 0;
	if (obj) do
	{
		top += obj.offsetTop;
		if (!obj.offsetParent) break;
		obj = obj.offsetParent;
	} while (true);

	return top;
}


function getIsComplexType(typeName)
{
	return (typeName == "aqds:table") || (typeName == "aqds:diagram") || (typeName == "aqds:text")
		|| (typeName == "aqds:graph") || (typeName == "aqds:picture") || (typeName == "aqds:pictures");
}

function getIsTableType(typeName)
{
	return (typeName == null || typeName == "aqds:table" || typeName == "aqds:graph" || typeName == "aqds:diagram" || typeName == "aqds:pictures");
}

function getColumnDataIsPlain(typeName)
{
	return (typeName != "aqds:table" && typeName != "aqds:graph" && typeName != "aqds:diagram");
}

function InitializeTableObject(obj, parent)
{
	obj.parent = parent;
	obj.nestedDataCount = 0;

	obj.columns = obj.columns || [];
	obj.items = obj.items || [];
	obj.typeName = obj.typeName || "aqds:table";
	obj.isPlainData = getColumnDataIsPlain(obj.typeName);
	
	var text_count = 0;
	for (var i = 0; i < obj.columns.length; i++)
	{
		// treat several text columns as complex type
		var typeName = obj.columns[i].typeName;
		if (typeName == "aqds:text")
			text_count++;

		if (getIsTableType(typeName))
		{
			// Complex type
			if (typeName != "aqds:pictures") { var _obj = obj; while (_obj) { _obj.nestedDataCount ++; _obj = _obj.parent; } }

			InitializeTableObject(obj.columns[i], obj);
		} else {

			// Simple type
			obj.columns[i].parent = obj;
			obj.columns[i].isImage = (typeName == "aqds:image");
			obj.columns[i].isNumeric = (typeName == "aqds:float" || typeName == "aqds:int");
			obj.columns[i].isDateTime = (typeName == "aqds:datetime");
			obj.columns[i].isPlainData = getColumnDataIsPlain(typeName);
			
			if (typeName == "aqds:text")
			{
				//if (text_count > 1)
				//	obj.columns[i] = new TableObject(obj, oColumnElement);
				obj.columns[i].textObject = new TextObject(obj.columns[i], obj);
			}
			if (obj.columns[i].name == "TypeDescription")
				obj.typeDescriptionColumnIndex = (i + 1);
		}
		obj.columns[i].filterList = [];
		obj.columns[i].filtered = false;
		obj.columns[i].isComplex = getIsComplexType(typeName);
	}

	if (text_count > 1) { var _obj = obj; while (_obj) { _obj.nestedDataCount ++; _obj = _obj.parent; } }
}

function doWindowResize()
{
	var oLogRoot = document.getElementById("logroot");
	if (oLogRoot && oLogRoot.doResize) oLogRoot.doResize();
}

function correctLocation(basePath, name)
{
	for (var i = basePath.length - 1; i >= 0; i--)
	{
		var _char = basePath.charAt(i);
		if ((_char == "\\") || (_char == "/"))
		{
			name = basePath.substring(0, i + 1) + name;
			break;
		}
	}
	if (isOpera) name = name.toLowerCase();
	return name;
}

function changeFileExt(fileName, newExt)
{
	for (var i = fileName.length - 1; i >= 0; i--)
	{
		var _char = fileName.charAt(i);
		if (_char == ".") 
		{
			return fileName.substring(0, i + 1) + newExt;
		}
	}
	return fileName;
}


function createTreeImage(opened)
{
	var oImage = document.createElement("img");
	oImage.src = "null.gif";
	oImage.className = opened ? "icon icon-minus": "icon icon-plus";
	oImage.width = 9;
	oImage.height = 9;
	oImage.border = 0;
	oImage.style.marginRight = "3px";
	oImage.style.marginLeft = "5px"; 
	oImage.style.cursor = m_PointerCursor;
	oImage.opened = opened;
	oImage.active = true;
	return oImage;
}

function createTreeImageDummy()
{
	var oImage = document.createElement("img");
	oImage.src = "null.gif";
	oImage.width = 9;
	oImage.height = 9;
	oImage.border = 0;
	oImage.style.marginRight = "3px";
	oImage.style.marginLeft = "5px";
	oImage.style.marginBottom = "1px";
	oImage.opened = false;
	oImage.active = false;
	return oImage;
}

function roloverTreeImage(img)
{
	img.opened = !img.opened;
	if (img.active == true)
		showTreeImage(img);
}

function hideTreeImage(img)
{
	img.active = false;
	img.className = "";
}

function showTreeImage(img)
{
	img.active = true;
	img.className = img.opened ? "icon icon-minus" : "icon icon-plus";
}

function createTreeStateImage(state)
{
	var oImage = document.createElement("img");
	oImage.src = "null.gif";
	if (state == 1) {
		oImage.className = "icon icon-warning";
	} else if (state == 2) {
		oImage.className = "icon icon-error";
	} else {
		oImage.className = "icon icon-ok";
	}
	oImage.width = 16;
	oImage.height = 16;
	oImage.border = 0;
	oImage.style.position = "relative";
	oImage.style.top = "4px";
	return oImage;
}

function getObjectWidth(obj)
{
	return (obj == null) ? 0: obj.offsetWidth;
}

function getColumnTypeIsSuppressed(typeName)
{
	return false;
}

function getHasNestedData(element)
{
	if (element.table != null)
	{
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
			//if (getColumnTypeIsSuppressed(oColumn.typeName))
			//  continue;
			  
			if (oColumn.isComplex)
			{
				if (oColumn.typeName == "aqds:text")
				{
					var empty_column = true;
					for (var j = 0; j < element.table.items.length; j++)
					{
						if (element.table.items[j][oColumn.name])
						{
							empty_column = false;
							break;
						}
					}
					if (empty_column)
						continue;
				}
				return true;
			}
		}
	}
	return false;
}

function getNestedDataIsPlain(element)
{
	if (element.table != null)
	{
		var text_count = 0;
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
			//if (getColumnTypeIsSuppressed(oColumn.typeName))
			//  continue;

			if (!oColumn.isPlainData)
				return false;

			if (oColumn.typeName == "aqds:text")
			{
				text_count++;
				if (text_count > 1)
					return false;
			}
		}
	}
	return true;
}

function TextObject(element, parent)
{
	this.parent = parent;
	this.nestedDataCount = 0;
	this.caption = element.caption;
	this.name = element.name;
	this.typeName = element.typeName || "aqds:text";
	this.textFormat = element.textformat || "";
	this[element.name] = element[element.name];
}

function FilesCompareObject(element, parent)
{
	this.parent = parent;
	this.nestedDataCount = 0;
	this.caption = element.caption;
	this.name = element.name;
	this.typeName = element.typeName || "aqds:filescompare";
	this.files = element[element.name] || [];
}

function TabsObject(elementId, onselect, parent, initialActiveTabName, atBottom, showBorder)
{
	this.elementId = elementId;
	this.items = [];
	this.names = [];
	this.activeTab = null;
	this.parent = parent;
	this.onselect = onselect;
	this.initialActiveTabName = initialActiveTabName;
	this.atBottom = atBottom;
	this.showBorder = showBorder;
	
	this.dispose = function()
	{
		this.parent = null;
		this.activeTab = null;
		for (var i = 0; i < this.items.length; i++)
		{
			var tab = this.getTabByIndex(i);
			tab.tabsObject = null;
			tab.tabItem = null;
		}
	}

	this.addItem = function(name, itemId)
	{
		this.names.push(name);
		this.items.push(itemId);
	}

	this.render = function()
	{
		var element = document.getElementById(this.elementId);
		var itemCount = this.items.length;
		if (!element || itemCount == 0) return;

		var posMain = (this.atBottom ? "bottom" : "top");
		var posOther = (this.atBottom ? "top" : "bottom");

		var html = "<table cellpadding=0 cellspacing=0 border=0 " + (this.showBorder ? " class='singleFrame'" : "") + 
			" style='width:100%; height:100%; min-height:22px; background-color:#CCCCCC; padding-" + posMain + ":1px;" + (this.showBorder ? " border-" + posOther + ": 0px;" : "") + "'><tr>";

		for (var i = 0; i < itemCount; i++)
		{
			if (itemCount > 1)
				html += "<td style='width:4px; text-indent:0px;'><img src='null.gif' style='width:4px; height:1px;'></td>";

			html += "<td><div id='" + this.elementId + "_tab" + i + "' " +
				"style='text-indent:0px; padding-left:8px; padding-right:8px; padding-" + posMain + ":" + (itemCount > 1 ? "3" : "1") + "px; padding-" + posOther + ":" + (itemCount > 1 ? "2" : "3") + "px; " +
				"white-space:nowrap; color:#444444; margin-" + posMain + ":1px; " +
				(itemCount > 1 ? " cursor:pointer; background-color:#DDDDDD; border-" + posMain + ":1px solid #CCCCCC;" : "") + "'";

			if (itemCount > 1)
			{
				html += " onmousemove=\"this.tabsObject.hoverTab(this, true)\" onmouseout=\"this.tabsObject.hoverTab(this, false)\"";
				html += " onclick=\"this.tabsObject.activateTab(this); if (window.event) window.event.cancelBubble = true;\"";
			}
			html += ">" + this.names[i] + "</div></td>";
		}
		html += "<td style='width:100%'></td></tr></table>";
		element.innerHTML = html;

		var tabToActivate = null;
		for (var i = 0; i < itemCount; i++)
		{
			var tab = this.getTabByIndex(i);
			if (!tab) continue;

			tab.tabsObject = this;
			tab.tabItem = document.getElementById(this.items[i]);
			tab.tabItemIndex = i;

			tab.remove = function()
			{
				this.tabItem.parentNode.removeChild(this.tabItem);
				this.tabsObject.items.splice(this.tabItemIndex, 1);
				this.tabsObject.names.splice(this.tabItemIndex, 1);
				this.tabsObject.render();
			}

			if (itemCount > 1 && i > 0)
				tab.tabItem.style.display = "none";

			if (i == 0 || this.names[i] == this.initialActiveTabName)
				tabToActivate = tab;
		}

		if (itemCount > 1 && tabToActivate)
			this.activateTab(tabToActivate);
	}

	this.getTabByIndex = function(index)
	{
		return document.getElementById(this.elementId + "_tab" + index);
	}

	this.hoverTab = function(tab, active)
	{
		if (tab.tabsObject.activeTab == tab) return;
		tab.style.color = (active ? "black" : "#444444");
	}

	this.activateTabByName = function(tabName)
	{
		if (!this || !this.items || !this.items.length) return;

		for (var i = 0; i < this.names.length; i++)
			if (this.names[i] == tabName)
				return this.activateTabByIndex(i);
	}

	this.activateTabByIndex = function(index)
	{
		if (!this || !this.items || !this.items.length || this.items.length <= index) return;

		var tab = this.getTabByIndex(index);
		return this.activateTab(tab);
	}

	this.activateTab = function(tab)
	{
		if (this.activeTab == tab) return;

		var prevTab = this.activeTab;
		if (prevTab)
		{
			prevTab.style.backgroundColor = "#DDDDDD";
			prevTab.style.color = "#444444";
			prevTab.style.cursor = "pointer";
			if (this.atBottom)
			{
				prevTab.style.paddingTop = "2px";
				prevTab.style.borderBottom = "1px solid #CCCCCC";
			}
			else
			{
				prevTab.style.paddingBottom = "2px";
				prevTab.style.borderTop = "1px solid #CCCCCC";
			}
			prevTab.tabItem.style.display = "none";
		}

		this.activeTab = tab;
		tab.style.backgroundColor = "white";
		tab.style.color = "black";
		tab.style.cursor = "default";
		if (this.atBottom)
		{
			tab.style.paddingTop = "3px";
			tab.style.borderBottom = "0px solid #CCCCCC";
		}
		else
		{
			tab.style.paddingBottom = "3px";
			tab.style.borderTop = "0px solid #CCCCCC";
		}
		tab.tabItem.style.display = "";

		if (this.onselect)
			this.onselect(tab, prevTab);
	}
}

var aqds_js = true;