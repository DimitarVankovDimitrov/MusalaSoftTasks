var m_providers = [];
var m_providerTabsDiv = null;
var m_treecell = null;
var m_providercell = null;
var m_RootLogData = null;
var m_rootnode = null;
var m_treediv = null;
var m_activenode = null;
var m_selectednode = null;
var m_treehead = null;
var m_treehead2 = null;
var m_treehidden = false;
var m_treetoolbar = null;
var m_loginfo = null;
var m_mainTabsDiv = null;
var treeHeadHeight = 20;
var treeHeadWidth = 21;
var treeToolbarHeight = 28;
var logInfoHeight = 100;
var treeToolbarAtTop = false;
var treeToolbarCaptions = true;
var m_FindNextErrorMsgAfterLoading = false;
var m_ExecutionPointToShow = [];
var m_ExecutionPointOpening = false;

var rootSummaryDivId = "rootSummaryDiv";
var rootTestLogDivId = "rootTestLogDiv";
var summaryTabCaption = "Summary";
var testLogTabCaption = "Log Details";

function logtree_loadComponent(element, src)
{
	var cWidth = document.body.clientWidth;
	var cHeight = document.body.clientHeight - c_InnerPadding * 2;
	var cTreeWidth = Math.round(cWidth * 0.25) - 1;

	if (cHeight < 300) cHeight = 300;

	element.style.width = cWidth + "px";
	element.style.height = cHeight + "px";
	
	var oDiv = document.createElement("DIV");
	element.appendChild(oDiv);
	oDiv.id = rootTestLogDivId;
	oDiv.style.width = "100%";
	oDiv.style.height = "100%";
	oDiv.element = element;

	var oTable = document.createElement("TABLE");
	oDiv.appendChild(oTable);
	element.rootTable = oTable;

	oTable.cellPadding = 0;
	oTable.cellSpacing = 0;
	oTable.border = 0;
	oTable.style.width = cWidth + "px";
	oTable.style.height = cHeight + "px";

	var oBody = document.createElement("TBODY");
	oTable.appendChild(oBody);
	
	var oTR = document.createElement("TR");
	oBody.appendChild(oTR);

	m_treecell = document.createElement("TD");
	m_treecell.style.width = cTreeWidth + "px";
	m_treecell.vAlign = "top";
	m_treecell.noWrap = true;
	m_treecell.className = "noprint";
	oTR.appendChild(m_treecell);
	
	m_treehead = document.createElement("DIV");
	m_treehead.className = "singleFrame";
	m_treehead.style.width = cTreeWidth + "px";
	m_treehead.style.height = treeHeadHeight + "px";
	m_treehead.style.borderBottom = "0px";
	m_treehead.id = "treehead";
	m_treecell.appendChild(m_treehead);
	
	m_treehead.innerHTML = "<div class='cellCaption'><div style='float:left'>Log Tree</div>" +
	  "<img src='null.gif' class='icon icon-hide' onmousemove='this.className=\"icon icon-hide1\"' onmouseout='this.className=\"icon icon-hide\"' " +
	  "style='float:right; margin:1px 3px 3px 1px; cursor:pointer;' " +
	  "onclick='treeHeadBtnClick()' alt='Hide'></div>";
	
	m_treehead2 = document.createElement("DIV");
	m_treehead2.className = "singleFrame";
	m_treehead2.style.display = "none";
	m_treehead2.style.width = treeHeadWidth + "px";
	m_treehead2.style.height = element.offsetHeight + "px";
	m_treehead2.id = "treehead2";
	m_treecell.appendChild(m_treehead2);
	
	m_treehead2.innerHTML = "<img src='null.gif' class='icon icon-show' onmousemove='this.className=\"icon icon-show1\"' " +
	  "onmouseout='this.className=\"icon icon-show\"' style='margin:3px; cursor:pointer;' " +
	  "onclick='treeHeadBtnClick()' alt='Show'>" +
	  "<div class='logtree_caption_vertical'>Log Tree</div>";
	
	m_treediv = document.createElement("DIV");
	m_treediv.className = "singleFrame";
	m_treediv.style.width = cTreeWidth + "px";
	m_treediv.style.height = element.offsetHeight - treeHeadHeight - treeToolbarHeight + (treeToolbarAtTop ? 0 : 1) + "px";
	m_treediv.style.borderTop = "0px";
	m_treediv.id = "logtree";

	m_treediv.style.padding = "3px";
	m_treediv.style.overflow = "auto";
	m_treecell.appendChild(m_treediv);

	m_treetoolbar = document.createElement("DIV");
	m_treetoolbar.className = "singleFrame";
	m_treetoolbar.style.width = cTreeWidth + "px";
	m_treetoolbar.style.height = treeToolbarHeight + "px";
	m_treetoolbar.style.position = "absolute";
	m_treetoolbar.style.left = "5px";
	m_treetoolbar.style.overflow = "hidden";
	var loginfo_offset = m_loginfo ? (logInfoHeight - 1) : 0;
	m_treetoolbar.style.top = (treeToolbarAtTop ? treeHeadHeight : (element.offsetHeight - treeToolbarHeight - loginfo_offset)) + 5 + "px";
	m_treetoolbar.id = "logtree_toolbar";
	m_treecell.appendChild(m_treetoolbar);

	var btn_td = "<td style='border:1px solid #ACA899; cursor:pointer; white-space: nowrap;' onmouseover='this.style.backgroundColor=\"#C0D0F0\"' onmouseout='this.style.backgroundColor=\"white\"' onmousedown='return false' ";
	m_treetoolbar.innerHTML = "<table cellpadding=0 cellspacing=2 border=0><tr>" +
		btn_td + "onclick='logtree_ExpandAll(true)'> <img src='null.gif' class='icon icon-expand' style='vertical-align:middle'" + (treeToolbarCaptions ? "> " : " title='") +"Expand All" + (treeToolbarCaptions ? "&nbsp;&nbsp;" : "'>") + "</td>" +
		btn_td + "onclick='logtree_ExpandAll(false)'> <img src='null.gif' class='icon icon-collapse' style='vertical-align:middle'" + (treeToolbarCaptions ? "> " : " title='") +"Collapse All" + (treeToolbarCaptions ? "&nbsp;&nbsp;" : "'>") + "</td>" +
		btn_td + "onclick='logtree_GoToError(); if (window.event) window.event.cancelBubble = true;'> <img src='null.gif' class='icon icon-error' style='margin:2px; vertical-align:middle'" + (treeToolbarCaptions ? "> <span>" : " title='") +"Go to Next Error" + (treeToolbarCaptions ? "</span>&nbsp;&nbsp;" : "'>") + "</td>" +
		"</tr></table>";

	var oTD = document.createElement("TD");
	oTD.style.width = "5px";
	oTD.noWrap = true;
	oTD.className = "noprint";
	oTR.appendChild(oTD);
	
	m_providercell = document.createElement("TD");
	m_providercell.vAlign = "top";
	m_providercell.style.width = cWidth - cTreeWidth - 5 + "px";
	m_providercell.id = m_providercell.uniqueID;
	oTR.appendChild(m_providercell);

	element.doResize = function()
	{
		var cWidth = document.body.clientWidth - (m_mainTabsDiv ? c_InnerPadding * 2 : 0);
		var cHeight = document.body.clientHeight - c_InnerPadding * 2 - (m_mainTabsDiv ? m_mainTabsDiv.offsetHeight : 0);
		var cTreeWidth = Math.round(cWidth * 0.25) - 1;

		if (cHeight < 300) cHeight = 300;
		if (cWidth < 500) cWidth = 500;

		var tree_Width = m_treehidden ? treeHeadWidth : cTreeWidth;
		var prov_Width = cWidth - tree_Width - 5;
		var prov_Height = cHeight - (m_providerTabsDiv ? (m_providerTabsDiv.offsetHeight - 1) : 0);
		
		for (var i = 0; i < m_providers.length; i++)
		{
			if (m_providers[i].m_rootElement && m_providers[i].m_rootElement.doResize)
				m_providers[i].m_rootElement.doResize(prov_Width, prov_Height);
		}

		m_providercell.style.width = prov_Width + "px";
		if (m_providerTabsDiv) m_providerTabsDiv.style.width = prov_Width + "px";

		m_treecell.style.width = tree_Width + "px";

		if (!m_treehidden)
		{
			m_treehead.style.width = tree_Width + "px";
			m_treediv.style.width = tree_Width + "px";
			m_treediv.style.height = cHeight - treeHeadHeight - (m_treetoolbar ? treeToolbarHeight - (treeToolbarAtTop ? 0 : 1) : 0) - (m_loginfo ? logInfoHeight - 1 : 0) + "px";
			if (m_treetoolbar)
			{
				m_treetoolbar.style.width = tree_Width + "px";
				var loginfo_offset = m_loginfo ? (logInfoHeight - 1) : 0;
				if (!treeToolbarAtTop) m_treetoolbar.style.top = (cHeight - treeToolbarHeight - loginfo_offset + 5) + "px";
			}
			if (m_loginfo)
			{
				m_loginfo.style.width = tree_Width + "px";
				m_loginfo.style.top = (cHeight - logInfoHeight) + 5 + "px";
			}
		}
		else
			m_treehead2.style.height = cHeight + "px";

		this.style.width = cWidth + "px";
		this.style.height = cHeight + "px";

		this.rootTable.style.width = cWidth + "px";
		this.rootTable.style.height = cHeight + "px";

		var m_provider = null;
		for (var i = 0; i < m_providers.length; i++)
		{
			if (m_providers[i].style.display == "none")
				continue;
				
			m_provider = m_providers[i];
			break;
		}

		var _obj = m_provider ? m_provider.m_rootElement : null;
		while (_obj != null)
		{
			if (_obj.m_dataTable) // Graph
				_obj = _obj.m_dataTable;

			if (_obj.rootDiv)
				table_UpdateColumnsPosition(_obj);

			_obj = _obj.m_NestedObject;
		}

	}

	_load_JSON(src, element, logtree_TreeLoad, logtree_LoadComplete);

	(window.addEventListener || window.attachEvent)(window.addEventListener ? "message" : "onmessage",
	function (event) {
		var data = event.data;
		if (typeof(data) == "string") // IE<10
			data = data.split(",");
		if (!data.length)
			return;
		var method = data.shift();
		if (typeof(window[method]) == "function")
			window[method](data);
	});
}

function logtree_CheckToolbar(element)
{
	var hasError = (m_RootLogData.status == 2);
	var hasWarning = (m_RootLogData.status == 1);
	var isTree = false;
	for (var i = 0; i < m_RootLogData.children.length; i++)
		if (m_RootLogData.children[i].children.length > 0) { isTree = true; break }

	if (!hasError && !hasWarning && !isTree)
	{
		m_treecell.removeChild(m_treetoolbar);
		m_treetoolbar = null;
		m_treediv.style.height = (element.offsetHeight - treeHeadHeight) + "px";
		return;
	}

	var tbl = m_treetoolbar.getElementsByTagName("TABLE")[0];
	if (!hasError && !hasWarning)
		tbl.rows[0].deleteCell(2);
	if (hasWarning)
	{
		var img = tbl.rows[0].cells[2].getElementsByTagName("IMG");
		if (img && img.length) img = img[0];
		if (img) img.className = "icon icon-warning";

		var txt = tbl.rows[0].cells[2].getElementsByTagName("SPAN");
		if (txt && txt.length) txt = txt[0];
		if (txt) txt.innerHTML = "Go To Next Warning";
	}

	if (!isTree)
	{
		tbl.rows[0].deleteCell(1);
		tbl.rows[0].deleteCell(0);
	}
}

function logtree_ExpandNodeChildren(node, expand, level)
{
	var activate_root = false;
	for (var i = 0; i < node.children.length; i++)
	{
		var div = node.children[i].treeNode;

		if (!expand && level > 0 && (m_selectednode ? m_selectednode == div : m_activenode == div))
			activate_root = true;

		if (!div.childrenPrepared)
		{
			if (expand)
				logtree_expandNode(div, false);
			else
				continue;
		}

		if (div.expanded != expand)
			logtree_expandLogDataNode.apply(div.image);

		activate_root = activate_root || logtree_ExpandNodeChildren(node.children[i], expand, level + 1);
	}
	return activate_root;
}

function logtree_ExpandAll(expand)
{
	if (expand) logtree_expandNode(m_rootnode, false);
	if (logtree_ExpandNodeChildren(m_RootLogData, expand, 0))
		logtree_setActiveNode(m_rootnode);
}

function logtree_FindNextErrorLog(searchData)
{
	var node = searchData.logData;

	for (var i = 0; i < node.children.length; i++)
	{
		var child_node = node.children[i];
		var div = child_node.treeNode;

		searchData.logData = child_node;

		if (searchData.skip)
		{
			if (child_node == m_activenode.logData)
				searchData.skip = false;
			
			if (logtree_FindNextErrorLog(searchData))
				return true;
			
			continue;
		}

		searchData.skip = false;

		if (child_node.status == m_RootLogData.status)
		{
			if (child_node.providers.length == 1)
			{
				var hasRedChildren = false;
				for (var j = 0; j < child_node.children.length; j++)
					if (child_node.children[j].status == m_RootLogData.status) { hasRedChildren = true; break }

				if (!hasRedChildren)
				{
					m_FindNextErrorMsgAfterLoading = true;
					logtree_setActiveNode(div);
					logtree_FindNextErrorMsg(true);
					return true;
				}
			}

			if (!div.childrenPrepared)
				logtree_expandNode(div, false);
		}

		if (logtree_FindNextErrorLog(searchData))
			return true;
	}

	return false;
}

function logtree_FindNextErrorMsg(fromTop, msgType)
{
	if (m_activenode && m_activenode.logData.providers.length == 1)
	{
		var table = m_providers[0].m_rootElement;
		if (table && table.findNextError && table.table && table.table.typeDescriptionColumnIndex)
		{
			m_FindNextErrorMsgAfterLoading = false;
			return table.findNextError(fromTop, msgType || (m_RootLogData.status == 2 ? "Error" : "Warning"));
		}
	}
	
	return false;
}

function logtree_GoToError(fromTop)
{
	text_clearSelection();
	if (!logtree_FindNextErrorMsg(fromTop))
	{
		var searchData = { logData: m_RootLogData, skip: m_activenode.logData != m_RootLogData };
		logtree_FindNextErrorLog(searchData);
	}
}

function treeHeadBtnClick()
{
	m_treehidden = !m_treehidden;
	m_treehead.style.display = m_treehidden ? "none" : "";
	m_treediv.style.display = m_treehidden ? "none" : "";
	m_treehead2.style.display = m_treehidden ? "" : "none";
	if (m_treetoolbar) m_treetoolbar.style.display = m_treehidden ? "none" : "";
	if (m_loginfo) m_loginfo.style.display = m_treehidden ? "none" : "";
	document.getElementById("logroot").doResize();
}

function InitializeLogNodeData(obj)
{
	obj.name = obj.name || "";
	obj.status = obj.status || 0;
	obj.href = obj.href || "";
	obj.id = obj.id || "";
	obj.schemaType = obj.schemaType || "aqds:none";
	obj.children = obj.children || [];
	obj.providers = obj.providers || [];
	obj.activeProviderName = "";

	var summary_index = -1;
	var perfcounters_index = -1;
	
	for (var i = 0; i < obj.providers.length; i++)
	{
		obj.providers[i].children = obj.providers[i].children || [];
		
		var provider_name = obj.providers[i].name.toLowerCase();
		if (provider_name.indexOf("summary") >= 0)
			summary_index = i;
		
		if (obj.providers[i].schemaType == "aqds:table" && provider_name.indexOf("performance counters") >= 0)
			perfcounters_index = i;
	}
	
	if (summary_index > 0) // put summary first
		obj.providers.splice(0, 0, obj.providers.splice(summary_index, 1)[0]);

	if (perfcounters_index == 1 && obj.providers[0].schemaType == "aqds:tree") // move perf counters to children of first provider
		obj.providers[0].children.push(obj.providers.splice(perfcounters_index, 1)[0]);

	for (var i = 0; i < obj.children.length; i++)
		InitializeLogNodeData(obj.children[i]);

	obj.empty = obj.children.length == 0;
}

function logtree_dateToString(date)
{
	return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function logtree_ShowInfo(element)
{
	if (m_RootLogData.info && m_RootLogData.info.isRootLog && m_mainTabsDiv == null)
	{
		m_loginfo = document.createElement("DIV");
		m_loginfo.className = "singleFrame";
		m_loginfo.style.width = m_treecell.offsetWidth + "px";
		m_loginfo.style.height = logInfoHeight + "px";
		m_loginfo.style.position = "absolute";
		m_loginfo.style.left = "5px";
		m_loginfo.style.overflow = "hidden";
		m_loginfo.style.backgroundColor = "#F0F0F0";
		m_loginfo.style.top = (element.offsetHeight - logInfoHeight) + 5 + "px";
		m_loginfo.style.padding = "2px";
		m_loginfo.id = "logtree_logInfo";
		m_treecell.appendChild(m_loginfo);

		var info = m_RootLogData.info;
		var startTime = (info.startTime ? logtree_dateToString(new Date(new Number(info.startTime))) : "N/A");
		var endTime   = (info.endTime   ? logtree_dateToString(new Date(new Number(info.endTime  ))) : "N/A");
		var runTime   = ((info.startTime && info.endTime) ? table_msecToString(info.endTime - info.startTime, true) : "N/A");
		m_loginfo.innerHTML = 
			"<img src='null.gif' class='icon icon-close' style='float:right; margin:1px; cursor:" + m_PointerCursor + "' onmouseover='this.className=\"icon icon-close1\"' onmouseout='this.className=\"icon icon-close\"' onclick='logtree_hideInfo()'>" +
			"<table cellpadding=1 cellspacing=2 border=0>" +
			"<tr><td style='width:60px'>Errors:    </td><td>" + info.errorCount   + "</td></tr>" + 
			"<tr><td>Warnings:  </td><td>" + info.warningCount + "</td></tr>" +
			"<tr><td>Start Time:</td><td>" + startTime         + "</td></tr>" +
			"<tr><td>Run Time:  </td><td title='End Time: " + endTime + "'>" + runTime + "</td></tr>" +
			"<tr><td>Computer:  </td><td title='User: " + info.userName + "\r\nVersion: " + info.version + "'>" + info.computerName + "</td></tr>" +
			"</table>";
	}
}

function logtree_hideInfo()
{
	m_treecell.removeChild(m_loginfo);
	m_loginfo = null;
	document.getElementById("logroot").doResize();
}

function logtree_onMainTabSelect(tab, prevTab)
{
	if (!tab.tabItem.contentLoaded)
	{
		logtree_InitializeRoot(tab.tabItem.element);
		tab.tabItem.contentLoaded = true;
		return;
	}

	doWindowResize();
}

function logtree_ShowSummary(element)
{
	if (!m_RootLogData.summary)
		return false;
		
	var tabsId = "mainTabsDiv";
	
	var logRootDiv = document.getElementById("logroot");

	document.body.style.margin = "0px";

	var oDiv = document.createElement("DIV");
	oDiv.id = rootSummaryDivId;
	oDiv.style.height = "100%";
	oDiv.contentLoaded = true;

	document.getElementById(rootTestLogDivId).style.margin = "5px";

	var iframe = window.document.createElement("IFRAME");
	iframe.frameBorder = 0;
	iframe.width = "100%";
	iframe.height = "100%";
	iframe.style.zIndex = 100;
	iframe.src = m_RootLogData.summary;

	oDiv.appendChild(iframe);
	logRootDiv.appendChild(oDiv);

	var oDiv = document.createElement("DIV");
	oDiv.id = tabsId;
	oDiv.innerText = _nbsp;
	oDiv.style.width = "100%";
	oDiv.style.height = "23px";
	oDiv.style.position = "fixed";
	oDiv.style.bottom = "0px";
	oDiv.zIndex = 100;
	logRootDiv.appendChild(oDiv);
	m_mainTabsDiv = oDiv;

	var tabs = new TabsObject(tabsId, logtree_onMainTabSelect, null, summaryTabCaption, true, false);

	m_mainTabsDiv.tabsObject = tabs;

	tabs.addItem(summaryTabCaption, rootSummaryDivId);
	tabs.addItem(testLogTabCaption, rootTestLogDivId);

	tabs.render();
	
	return true;
}

function logtree_TreeLoad(element, data)
{
	m_RootLogData = data;

	if (logtree_ShowSummary(element))
		return;
		
	logtree_InitializeRoot(element);
}

function logtree_InitializeRoot(element)
{
	InitializeLogNodeData(m_RootLogData);

	m_rootnode = logtree_createLogDataNode(m_treediv, m_RootLogData);
	if (!m_ExecutionPointOpening)
		logtree_setActiveNode(m_rootnode);
	logtree_expandNode(m_rootnode, true);

	logtree_CheckToolbar(element);
	
	logtree_ShowInfo(element);
}

function logtree_LoadComplete()
{
	if (!m_RootLogData || m_mainTabsDiv)
		return;
	
	if (m_RootLogData.status == 2 || m_RootLogData.status == 1) // has error or warning
		logtree_GoToError(true);
}

function logtree_setSelectedNode(node)
{
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "white";
	}
	
	m_selectednode = node;
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "#999999";
	}
	
	if (m_activenode != null)
	{
		m_activenode.caption.style.borderColor = "#CCCCCC";
	}
	
}

function logtree_setActiveNode(node)
{
	if (m_activenode == node)
		return;

	if (m_activenode != null)
	{
		m_activenode.caption.style.backgroundColor = "";
		m_activenode.caption.style.borderColor = "white";
	}
	
	if (m_selectednode != null)
	{
		m_selectednode.caption.style.backgroundColor = "";
		m_selectednode.caption.style.borderColor = "white";
	}
	m_selectednode = null;
	
	m_activenode = node;
	if (m_activenode != null)
	{
		m_activenode.caption.style.backgroundColor = "#CCCCCC";
		m_activenode.caption.style.borderColor = "#999999";
		
		logtree_expandParent(node);
		m_activenode.doActivate();
		logtree_prepareChildren(node);
	}
}

function logtree_expandParent(node)
{
	if (!node || !node.parentNode)
		return;

	var parent = node.parentNode.parentNode;
	if (parent && parent.logData && !parent.expanded)
	{
		logtree_expandParent(parent);
		logtree_expandNode(parent);
	}
}

function logtree_expandNode(oDiv, recursive)
{
	if (!oDiv.expanded && oDiv.image)
		logtree_expandLogDataNode.apply(oDiv.image);
}

function logtree_prepareChildren(oDiv)
{
	if (oDiv.childDiv == null)
	{
		var oChildDiv = document.createElement("DIV");
		oChildDiv.style.marginLeft = (getScreenX(oDiv.caption) - getScreenX(oDiv.statusImage)) + "px";
		oChildDiv.style.display = "none";
		oDiv.appendChild(oChildDiv);
		oDiv.childDiv = oChildDiv;
	}

	if (oDiv.childrenPrepared == false)
	{
		if (!oDiv.logData.empty)
			logtree_createLogDataTree(oDiv.childDiv, oDiv.logData, false);
		oDiv.childrenPrepared = true;
	}
}

function logtree_expandLogDataNode()
{
	var oDiv = this.ownerDiv; // this - node expand image
	
	roloverTreeImage(oDiv.image);

	logtree_prepareChildren(oDiv);

	if (oDiv.expanded == false)
	{
		if (!oDiv.logData.empty) 
		{
			oDiv.childDiv.style.display = "";
			oDiv.childDiv.style.width = "100%";
		}
		else
		{
			hideTreeImage(oDiv.image);
			oDiv.image.onclick = null;
		}

	} else 
	{
		oDiv.childDiv.style.display = "none";
	}
	oDiv.expanded = !oDiv.expanded;
}

function logtree_activateLogDataNode()
{
	var oDiv = this.ownerDiv; // this - node caption span
	logtree_setActiveNode(oDiv);
}

function logtree_createLogDataNode(parent, logData)
{
	var oDiv = document.createElement("DIV");
	parent.appendChild(oDiv);

	oDiv.childDiv = null;
	oDiv.logData = logData;
	oDiv.expanded = false;
	oDiv.childrenPrepared = false;
	if (logData.id) oDiv.id = logData.id;

	var oNoBr = document.createElement("NOBR");
	oDiv.appendChild(oNoBr);

	var oCaption = document.createElement("SPAN");
	oCaption.className = "treeNodeCaption";
	oCaption.innerText = logData.name;
	oCaption.ownerDiv = oDiv;
	oCaption.style.marginLeft = "1px";
	oDiv.caption = oCaption;
	oDiv.caption.onclick = logtree_activateLogDataNode;
	
	oNoBr.appendChild(oCaption);

	//oCaption.style.width = oCaption.offsetWidth;

	if (!logData.empty)
	{
		oDiv.image = createTreeImage(false);
		oDiv.image.onclick = logtree_expandLogDataNode;
	} else {
		oDiv.image = createTreeImageDummy();
	}
	oDiv.image.ownerDiv = oDiv;
	oNoBr.insertBefore(oDiv.image, oDiv.caption);

	oDiv.statusImage = createTreeStateImage(logData.status);
	oNoBr.insertBefore(oDiv.statusImage, oDiv.caption);

	oDiv.doActivate = logtree_m_LogDataNode_Activate;
	
	return oDiv;
}

function logtree_m_LogDataNode_Activate()
{
	window.status = "Loading...";
	var logData = this.logData; // this - node div
	if (logData != null)
	{
		if ((logData.schemaType == null || logData.schemaType == "" || logData.schemaType == "aqds:none") && (logData.providers.length == 0))
		{
			logtree_expandNode(this, false);
			if (logData.children.length > 0) 
			{
				var nextDiv = logData.children[0].treeNode;
				if (nextDiv != null)
				{
					nextDiv.caption.click();
					logtree_setSelectedNode(this);
					return;
				}
			}
			
		}
		logtree_activateProvider(logData);
	}
	window.status = "Done";
}

function logtree_createLogDataTree(parentDiv, logData, createExpanded)
{
	for (var i = 0; i < logData.children.length; i++)
	{
		var oChildDiv = logtree_createLogDataNode(parentDiv, logData.children[i]);
		logData.children[i].treeNode = oChildDiv;
		
		if (createExpanded)
		{
			logtree_expandNode(oChildDiv, createExpanded);
		}
	}

}

function logtree_loadProvider(node, update, providerDiv)
{
	var m_provider = providerDiv; //m_providers[m_providers.length - 1];
	m_provider.realSchemaType = node.schemaType;
	m_provider.schemaKey = node.schemaKey || "";
	m_provider.src = node.href;
	m_provider.childProviders = node.children;

	if (node.schemaType == "aqds:table" || node.schemaType == "aqds:tree"
	  || node.schemaType == "aqds:graph" || node.schemaType == "aqds:diagram"
	  || node.schemaType == "aqds:text" || node.schemaType == "aqds:filescompare")
	{
		m_provider.className = "aqds_provider";
		ProviderLoad(m_provider);
	}
	else if (node.schemaType == "aqds:picture")
	{
		m_provider.className = "aqds_picture";
	}
	else if (node.schemaType == "aqds:pictures")
	{
		m_provider.className = "aqds_pictures";
	}
	else {
		m_provider.className = "aqds_text";
		if (update)
			text_Load(m_provider);
		else
			text_load(m_provider);
	}
}

function logtree_activateProvider(node)
{
	var m_provider = null;
	if (node.providers.length == 1 && m_providers.length == 1)
		m_provider = m_providers[0];

	if (m_provider != null)
	{
		for (var i = 0; i < m_provider.schemas.length; i++)
		{
			if (node.schemaType == m_provider.schemas[i])
			{
				logtree_loadProvider(node, true, m_provider);
				return;
			}
		}
	}

	if (m_providerTabsDiv)
	{
		m_providerTabsDiv.tabsObject.dispose();
		m_providerTabsDiv.tabsObject = null;
		m_providercell.removeChild(m_providerTabsDiv);
		m_providerTabsDiv = null;
	}
	
	for (var i = 0; i < m_providers.length; i++)
	{
		provider_clear(m_providers[i]);
		m_providercell.removeChild(m_providers[i]);
	}
	
	m_providers = [];

	var tabsId = "providerTabsDiv";
	if (node.providers.length > 1)
	{
		var oDiv = document.createElement("DIV");
		oDiv.id = tabsId;
		oDiv.innerText = _nbsp;
		oDiv.style.height = "24px";
		oDiv.style.position = "fixed";
		oDiv.style.bottom = c_InnerPadding + "px";
		oDiv.zIndex = 100;
		m_providercell.appendChild(oDiv);
		m_providerTabsDiv = oDiv;

		var tabs = new TabsObject(tabsId, logtree_onProviderTabSelect, node, node.activeProviderName, true, true);

		m_providerTabsDiv.tabsObject = tabs;
	}

	var firstItem = null;
	for (var i = 0; i < node.providers.length; i++)
	{
		if (firstItem)
			firstItem.style.display = "none";
	
		m_provider = document.createElement("DIV");
		m_provider.id = "provider_div_" + m_provider.uniqueID;

		m_provider.style.width = "100%";
		m_provider.style.height = "100%";

		m_providercell.insertBefore(m_provider, m_providerTabsDiv);

		m_providers[i] = m_provider;

		if (tabs)
			m_provider.m_providerData = node.providers[i];
		else
			logtree_loadProvider(node.providers[i], false, m_provider);

		if (firstItem)
			m_provider.style.display = "none";
		else
			firstItem = m_provider;

		if (tabs)
			tabs.addItem(node.providers[i].name, m_provider.id);
	}

	if (tabs)
		tabs.render();
	//else // resize to ensure correct log view
	//	doWindowResize();
}

function logtree_onProviderTabSelect(tab, prevTab)
{
	if (!tab.contentLoaded)
	{
		logtree_loadProvider(tab.tabItem.m_providerData, false, m_providers[tab.tabItemIndex]);
		tab.contentLoaded = true;
	}

	doWindowResize();

	tab.tabsObject.parent.activeProviderName = tab.tabsObject.names[tab.tabItemIndex];
	m_arrowKeysCapturedBy = (tab.tabItem.m_rootElement && tab.tabItem.m_rootElement.captureKeys ? tab.tabItem.m_rootElement : null);
}

function logtree_openNode(id)
{
	var node = document.getElementById(id);
	if (node == null)
		return false;

	logtree_setActiveNode(node);

	return false;
}

function logtree_openSibling(id)
{
	if (m_providerTabsDiv && m_providerTabsDiv.tabsObject)
		m_providerTabsDiv.tabsObject.activateTabByName(id);

	return false;
}

function logtree_openChild(index)
{
	if (!m_activenode || !m_activenode.logData || m_activenode.logData.empty) return;
	if (m_activenode.logData.children.length <= index) return;
	logtree_prepareChildren(m_activenode);
	logtree_setActiveNode(m_activenode.logData.children[index].treeNode);

	return false;
}

function logtree_findNodeById(currentNode, id, path)
{
	path = path || [];
	for (var i = 0; i < currentNode.children.length; i++)
	{
		var child_node = currentNode.children[i];

		if (child_node.id == id)
		{
			for (var d = 0; d < path.length; d++)
				if (!path[d].treeNode.childrenPrepared)
					logtree_expandNode(path[d].treeNode, false);
			return child_node.treeNode;
		}

		path.push(child_node);
		
		var node = logtree_findNodeById(child_node, id, path);
		if (node)
			return node;
			
		path.pop();
	}

	return null;
}

function logtree_gotoExecutionPointItem()
{
	if (!m_activenode || m_ExecutionPointToShow.length != 3)
		return;

	for (var i = 0; i < m_activenode.logData.providers.length; i++)
	{
		if (m_activenode.logData.providers[i].schemaKey == m_ExecutionPointToShow[1])
		{
			var table = m_providers[i].m_rootElement;
			if (table && table.activateRowById)
			{
				table.activateRowById(m_ExecutionPointToShow[2]);
				m_ExecutionPointToShow = [];
				break;
			}
		}
	}
}

function logtree_gotoExecutionPoint(ep)
{
	if (!ep || ep.length != 3)
		return false;

	m_ExecutionPointToShow = ep;
	m_ExecutionPointOpening = true;

	m_mainTabsDiv.tabsObject.activateTabByName(testLogTabCaption);

	m_ExecutionPointOpening = false;

	window.focus();

	var node = ep[0] ? document.getElementById(ep[0]) : m_rootnode;
	if (!node)
		node = logtree_findNodeById(m_RootLogData, ep[0]);
	if (!node)
		return false;

	logtree_setActiveNode(node);

	logtree_gotoExecutionPointItem();
	
	return false;
}

function onDocumentClick(e)
{
	if (e == null) e = window.event;

	var column = m_providercell.m_filteredColumn;
	if (column != null)
	{
		var target = e.target;
		if (target == null)
			target = e.srcElement;

		if (target == column.filterImage) return;

		var filter = column.realTD.m_dataTable.parentNode.m_filterDiv;
		var parent = target;
		while (parent != null)
		{
			if (parent == filter)
				return;
			parent = parent.offsetParent;
		}
		caption_hideFilter(column);
	}
	
	m_arrowKeysCapturedBy = null;
	
	var obj = e.target || e.srcElement;
	while (obj)
	{
		if (obj.captureKeys)
		{
			m_arrowKeysCapturedBy = obj;
			break;
		}
		obj = obj.parentElement || obj.parentNode;
	}
}

var m_arrowKeysCapturedBy = null;

function onDocumentKeyDown(e)
{
	if (!m_arrowKeysCapturedBy) return;

	if (!e) e = window.event;
	if ((e.keyCode >= 33 && e.keyCode <= 40) || (e.keyCode == 106 /* '*' */))
	{
		var element = m_arrowKeysCapturedBy;
		if (element && element.onCapturedKeys && element.onCapturedKeys(element, e.keyCode))
		{
			if (e.preventDefault) e.preventDefault();
			return false;
		}
	}
	
	return true;
}

if (document.addEventListener)
{
	document.addEventListener("click", onDocumentClick, true);
	document.addEventListener("keydown", onDocumentKeyDown, true);
}
else
{
	document.attachEvent("onclick", onDocumentClick);
	document.attachEvent("onkeydown", onDocumentKeyDown);
}

function ProviderLoad(element)
{
	if (element.m_rootElement != null)
		provider_clear(element);

	element.m_rootElement = window.document.createElement("TABLE");
	element.m_rootElement.className = "singleFrame";
	element.m_rootElement.cellSpacing = 0;
	element.m_rootElement.cellPadding = 0;
	element.m_rootElement.border = 0;
	element.m_rootElement.style.width = element.style.width;
	element.m_rootElement.style.height = element.style.height;
	
	var oBody = window.document.createElement("TBODY");
	element.m_rootElement.appendChild(oBody);
	
	var oTR = window.document.createElement("TR");
	oBody.appendChild(oTR);
	
	var oTD = window.document.createElement("TD");
	oTD.vAlign = "top";
	oTR.appendChild(oTD);
	
	var oDiv = window.document.createElement("DIV");
	oDiv.style.padding = "3px";
	oTD.appendChild(oDiv);
	
	var oI = window.document.createElement("I");
	oI.innerText = "Loading...";
	oDiv.appendChild(oI);

	element.appendChild(element.m_rootElement);

	_load_JSON(element.src, element, ProviderLoaded);

	if (element.realSchemaType == "aqds:text")
		element.schemas = new Array("aqds:text");
	else
		element.schemas = new Array("aqds:tree", "aqds:table");
}

function provider_clear(element)
{
	if (element.m_rootElement == null)
		return;

	table_clear(element.m_rootElement);
	text_clear(element.m_rootElement);

	element.removeChild(element.m_rootElement);
	element.m_rootElement = null;
}

function provider_GetInnerObjectClass(element, obj)
{
	if (element.realSchemaType == "aqds:table" || element.realSchemaType == "aqds:tree") 
	{
		obj.showCaption = true;
		table_setActive(obj);
		return "aqds_table";
	} 
	else if (element.realSchemaType == "aqds:text") 
	{
		text_load(obj);
		return "aqds_text";
	} 
	else if (element.realSchemaType == "aqds:filescompare") 
	{
		text_files_compare(obj);
		return "aqds_files_compare";
	} 
	else 
	{
		return "";
	}
}

function ProviderLoaded(element, data)
{
		provider_clear(element);

		element.m_rootElement = window.document.createElement("DIV");
		element.appendChild(element.m_rootElement);

		element.m_rootElement.location = element.src;
		element.m_rootElement.id = "provider_div2_" + element.m_rootElement.uniqueID;

		element.m_rootElement.style.width = element.style.width;
		element.m_rootElement.style.height = element.style.height;

		if (element.realSchemaType == "aqds:text")
		{
			element.m_rootElement.textObject = new TextObject(data);
		}
		else if (element.realSchemaType == "aqds:filescompare")
		{
			element.m_rootElement.filesCompare = new FilesCompareObject(data);
		}
		else
		{
			InitializeTableObject(data);
			if (element.childProviders.length)
			{
				var childSrc = element.childProviders[0].href;
				_load_JSON(childSrc, element, ChildProviderLoaded);
			}
			element.m_rootElement.table = data;
		}

		if (element.childProviders.length == 0)
			provider_GetInnerObjectClass(element, element.m_rootElement);

		if (m_FindNextErrorMsgAfterLoading)
			logtree_FindNextErrorMsg(true);
			
		if (m_ExecutionPointToShow.length != 0)
		{
			logtree_gotoExecutionPointItem();
			if (m_ExecutionPointToShow.length != 0)
			{
				var status = m_activenode.logData.status;
				if (status == 1 || status == 2)
					logtree_FindNextErrorMsg(false, status == 2 ? "Error" : "Warning");
			}
		}
}

function ChildProviderLoaded(element, data)
{
	var columns = element.m_rootElement.table.columns;
	columns[columns.length] = data;
	var column = columns[columns.length - 1];
	InitializeTableObject(column);
	column.parent = null;
	column.syncRecords = true;
	column.filterList = [];
	column.filtered = false;
	column.isComplex = true;

	provider_GetInnerObjectClass(element, element.m_rootElement);
}

function showLog()
{
	var clientWidth = document.body.clientWidth;
	if (clientWidth > 0 && typeof(aqds_js) != 'undefined' && typeof(caption_js) != 'undefined' &&
		typeof(picture_js) != 'undefined' && typeof(table_js) != 'undefined' && typeof(text_js) != 'undefined')
		logtree_loadComponent(document.getElementById("logroot"), "_root.js");
	else
		window.setTimeout(showLog, 50);
}

if (isSupported)
	window.setTimeout(showLog, 100);
