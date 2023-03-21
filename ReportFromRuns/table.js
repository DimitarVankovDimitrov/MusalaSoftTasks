var c_ShowToolbar = true;
var c_ShowTimeDifference = undefined;
var c_DimSmallTimeDifferenceMs = 0;

var c_MaxItemsToLoadTreeAtOnce = 1000;
var c_StatusProgress = false;

var c_InnerPadding = 5;

var c_ShowContentForExtensions = ["txt", "htm", "html", "xml", "jpg", "jpeg", "gif", "png"];

var c_ExternalLinkProtocols = ["http", "https", "file", "ftp", "mailto", "tel"];

var c_ShowSplitters = true;
var c_splitterSize = 4;
var c_minHeight = 150;
var c_minWidth = 220;

var c_tableToolbarHeight = 27;

function table_setActive(element)
{
	table_clear(element);
	element.innerHTML = "";
	element.preventDefault = false;
	element.activeDetailsTabName = "";

	element.captureKeys = true;
	element.onCapturedKeys = table_onCapturedKeys;

	if (!m_arrowKeysCapturedBy)
		m_arrowKeysCapturedBy = element;

	element.totalRowCount = element.table.items.length;

	var rootId = (element.totalRowCount > 0 ? element.table.items[0].pid || -1 : -1);
	for (var i = 0; rootId >= 0 && i < element.totalRowCount; i++)
		if (element.table.items[i].pid < rootId)
			rootId = element.table.items[i].pid;
	
	element.loadTreeAtOnce = element.totalRowCount <= c_MaxItemsToLoadTreeAtOnce;
	element.totalRowCount = ((c_StatusProgress && element.loadTreeAtOnce) ? totalRowCount : 0);
	element.loadedRowCount = 0;

	table_CreateRootFrame(element);
	table_CreateToolbar(element);
	table_CreateTable(element);
	table_ClearFilter(element);
	table_CreateRows(element, null, rootId, 0);

	table_resizeCaptions(element);

	// Creating columns here because their widths are correct only after appending to body

	var tp = element.rootDiv.tablePane;
	tp.m_dataTable.creating = true;
	tp.m_dataTable.totalWidth = 0;

	for (var i = 0; i < element.m_Captions.length; i++)
	{
		if (element.m_Captions[i].column && element.m_Captions[i].column.isComplex)
			continue;
		caption_CreateControl(element.m_Captions[i], false);
	}

	if (tp.m_dataTable.mozilla)
	{
		tp.m_dataTable.width = tp.m_dataTable.totalWidth;
		tp.linkedDiv.m_headTable.width = tp.m_dataTable.totalWidth;
	}
	tp.m_dataTable.creating = false;
	if (tp.m_dataTable.rows.length > 1)
		table_doShowNestedData.apply(tp.m_dataTable.rows[1]);

	table_updateFilterState(element);
	table_checkHeaderWidth(tp);

	if (c_ShowTimeDifference)
		table_updateDateTimeColumnsForTable(tp.m_dataTable);

	table_OperaForceRedraw(element, true);
}

function table_clear(element)
{
	if (element.m_NestedObject)
	{
		table_clear(element.m_NestedObject);
		text_clear(element.m_NestedObject);
		element.m_NestedObject.popupDiv = null;
		element.m_NestedObject.popupIFrame = null;
		element.m_NestedObject = null;
	}
	if (element.table && element.table.columns)
		for (var i = 0; i < element.table.columns.length; i++)
		{
			if (element.table.columns[i].realTD)
			{
				element.table.columns[i].realTD.column = null;
				element.table.columns[i].realTD.m_dataTable = null;
				element.table.columns[i].realTD = null;
			}
			if (element.table.columns[i].m_caption)
			{
				caption_clear(element.table.columns[i].m_caption);
				element.table.columns[i].m_caption.realTD = null;
				element.table.columns[i].m_caption.column = null;
				element.table.columns[i].m_caption = null;
			}
		}
	if (element.rootDiv)
	{
		if (element.rootDiv.tablePane)
		{
			element.rootDiv.tablePane.tableElement = null;
			element.rootDiv.tablePane.linkedDiv.parentDiv = null;
			element.rootDiv.tablePane.linkedDiv.m_headTable = null;
			element.rootDiv.tablePane.linkedDiv = null;
			element.rootDiv.tablePane.m_dataTable = null;
			element.rootDiv.tablePane = null;
		}
		element.rootDiv = null;
	}
	if (element.splitter)
	{
		element.splitter.tableElement = null;
		element.splitter = null;
	}
	if (element.detailsHead)
	{
		element.detailsHead.m_element = null
		element.detailsHead = null;
	}
	if (element.detailsHead2)
	{
		element.detailsHead2.m_element = null
		element.detailsHead2 = null;
	}
	if (element.rowBody)
	{
		for (var i = 0; i < element.rowBody.rows.length; i++)
		{
			element.rowBody.rows[i].subRows = null;
			element.rowBody.rows[i].parentRow = null;
			element.rowBody.rows[i].tableElement = null;
			element.rowBody.rows[i].defaultColumn = null;
			element.rowBody.rows[i].m_LinkTabs = null;
		}
	}
	if (element.detailsTabsDiv)
	{
		if (element.detailsTabsDiv.m_tabsObject)
		{
			element.detailsTabsDiv.m_tabsObject.dispose();
			element.detailsTabsDiv.m_tabsObject = null;
		}
		element.detailsTabsDiv = null;
	}
	if (element.m_toolbar)
	{
		element.m_toolbar.element = null;
		element.m_toolbar = null;
	}
	element.rootTable = null;
	element.detailsDiv = null;
	element.doResize = null;
	element.rowBody = null;
	element.m_activeRow = null;
	element.m_Captions = null;
}

function table_activateRow(element, rowIndex, scrollIntoView)
{
	if (!element || !element.rowBody)
		return;
	
	var new_row = element.rowBody.rows[rowIndex];
	var activeRowIndex = element.m_activeRow ? element.m_activeRow.rowIndex - 1 : 0;
	table_setActiveRow(element, new_row, true);
	if (scrollIntoView)
	{
		var tablePane = element.rootDiv.tablePane;
		var rowHeight = new_row.offsetHeight;
		if (rowIndex >= activeRowIndex)
		{
			var visibleRowCount = Math.floor((element.rootDiv.tablePane.clientHeight - 6) / rowHeight) - 1;
			var row = document.elementFromPoint(getScreenX(element.rootDiv.tablePane) + 5, getScreenY(element.rootDiv.tablePane) + element.rootDiv.tablePane.clientHeight - rowHeight + 1);
			while (row && row.nodeName.toLowerCase() != "tr") row = row.parentNode;
			var lastVisibleRowIndex = row ? row.rowIndex - 1 : Math.floor(tablePane.scrollTop / rowHeight) + visibleRowCount - 1;
			if (rowIndex > lastVisibleRowIndex)
				tablePane.scrollTop = row ? (tablePane.scrollTop + (getScreenY(new_row) - getScreenY(row))) : ((rowIndex - visibleRowCount + 1) * rowHeight);
		}
		else
		{
			var row = document.elementFromPoint(getScreenX(element.rootDiv.tablePane) + 5, getScreenY(element.rootDiv.tablePane) + (rowHeight * 2) + 6);
			while (row && row.nodeName.toLowerCase() != "tr") row = row.parentNode;
			var firstVisibleRowIndex = row ? row.rowIndex - 1 : Math.ceil(tablePane.scrollTop / rowHeight);
			if (rowIndex < firstVisibleRowIndex)
				tablePane.scrollTop = row ? (Math.ceil((tablePane.scrollTop + (getScreenY(new_row) - getScreenY(row))) / rowHeight) * rowHeight) : (rowIndex * rowHeight);
		}
	}
	table_doShowNestedData.apply(new_row);
}

function table_onCapturedKeys(element, keyCode)
{
	if (!element.m_activeRow)
		return false;

	var rowIndex = element.m_activeRow.rowIndex - 1;
	var lastIndex = element.rowBody.rows.length - 1;
	var newIndex = rowIndex;
	var direction = 0;
	var row = null;
	
	if (keyCode == 33 || keyCode == 34 || keyCode == 38 || keyCode == 40)
	{
		var visibleRowCount = Math.floor((element.rootDiv.tablePane.clientHeight - 6) / element.m_activeRow.offsetHeight) - 2;
		
		var indexDelta = 0;

		if (keyCode == 38 /* up arrow */) 		 { direction = -1; indexDelta = 1; }
		else if (keyCode == 40 /* down arrow */) { direction = +1; indexDelta = 1; }
		else if (keyCode == 33 /* page up */)    { direction = -1; indexDelta = visibleRowCount; }
		else if (keyCode == 34 /* page down */)  { direction = +1; indexDelta = visibleRowCount; }

		var testIndex = newIndex + direction;
		while (indexDelta > 0 && testIndex >= 0 && testIndex <= lastIndex)
		{
			row = element.rowBody.rows[testIndex];
			if (row.style.display != "none")
			{
				newIndex = testIndex;
				indexDelta--;
			}
			testIndex += direction;
		}
	}
	else if (keyCode == 35 || keyCode == 36)
	{
		if (keyCode == 35 /* end */)        { direction = -1; newIndex = lastIndex; }
		else if (keyCode == 36 /* home */)  { direction = +1; newIndex = 0; }
		
		for (;;)
		{
			row = element.rowBody.rows[newIndex];
			if ((row.style.display != "none") || (newIndex + direction < 0) || (newIndex + direction > lastIndex))
				break;
			newIndex += direction;
		}
	}
	else if (keyCode == 37 || keyCode == 39) // left & right arrows
	{
		if (element.m_activeRow.row_nety) // expand / collapse, or go to first child
		{
			if (element.m_activeRow.m_treeImage && element.m_activeRow.m_treeImage.opened != (keyCode == 39))
			{
				element.m_activeRow.m_treeImage.click();
				return true;
			}

			if (keyCode == 39)
			{
				for (var i = 0; i < element.m_activeRow.subRows.length; i++)
				{
					if (element.m_activeRow.subRows[i].style.display != "none")
					{
						newIndex = element.m_activeRow.subRows[i].rowIndex - 1;
						break;
					}
				}
			}
		}

		if (keyCode == 37 && element.m_activeRow.parentRow && element.m_activeRow.parentRow.style.display != "none") // go top
		{
			newIndex = element.m_activeRow.parentRow.rowIndex - 1;
		}
	}
	else if (keyCode == 106) // *
	{
		if (element.m_activeRow.row_nety)
		{
			var expandSubRows = function(rows)
			{
				var len = rows.length;
				for (var i = 0; i < len; i++)
				{
					var oTR = rows[i];
					if (!oTR.opened && oTR.m_treeImage)
						oTR.m_treeImage.click();

					var subRows = oTR.subRows;
					if (subRows && subRows.length)
						expandSubRows(subRows);
				}
			}
		
			expandSubRows([element.m_activeRow]);
			
			table_activateRow(element, newIndex, true);
			return true;
		}
	}
	
	if (newIndex != rowIndex)
		table_activateRow(element, newIndex, true);
	
	return true;
}

function table_CreateTable(element)
{
	element.m_Captions = new Array();

	if (element.table.columns != null)
	{
		var oTablePane = window.document.createElement("DIV");
		oTablePane.className = "tableBody";
		element.rootDiv.appendChild(oTablePane);
		element.rootDiv.tablePane = oTablePane;
		oTablePane.tableElement = element;

		oTablePane.style.width = element.rootDiv.offsetWidth - (element.noFrame ? 0 : 2 * c_InnerPadding) + "px";
		oTablePane.style.height = element.rootDiv.offsetHeight - (element.noFrame ? 0 : 2 * c_InnerPadding) + "px";

		var oTable = window.document.createElement("TABLE");
		oTablePane.appendChild(oTable);
		oTable.cellPadding = 0;
		oTable.cellSpacing = 0;
		oTable.border = 0;
		oTable.style.position = "relative";
		oTable.style.top = "4px";

		oTable.m_sortColumnId = -1;
		oTable.m_sortAscending = true;
		oTable.m_sortCaption = null;

		var oHead = window.document.createElement("THEAD");
		oTable.appendChild(oHead);
	
		var oTR = window.document.createElement("TR");
		oHead.appendChild(oTR);
		
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
			if (oColumn.isComplex)
				continue;
			
			var oTD = window.document.createElement('TD');
			oTD.column = oColumn;
			oTD.m_dataTable = oTable;
			oTD.noWrap = true;
			oColumn.realTD = oTD;
			oTD.className = "cellValue printOnly"; // set caption to minimize table reflow
			oTD.style.color = "white";
			oTD.innerText = oColumn.caption;
			oTR.appendChild(oTD);
			oTD.style.width = (oTD.offsetWidth + 30) + "px"; // save size and remove caption
			oTD.style.height = oTD.offsetHeight + "px";
			oTD.className = "";
			//oTD.innerText = ""; // leave caption for print
		}

		var oBody = window.document.createElement("TBODY");
		element.rowBody = oBody;
		oTable.appendChild(oBody);

		oTablePane.m_dataTable = oTable;
		oTablePane.getScreenX = Function("return getScreenX(this)");
		oTablePane.getScreenY = Function("return getScreenY(this)");
		
// Creating headers of columns

		var oFlowDiv = window.document.createElement("DIV");
		element.rootDiv.appendChild(oFlowDiv);

		oFlowDiv.id = "oFlowDiv";
		oFlowDiv.className = "noprint";
		oFlowDiv.parentDiv = oTablePane;
		oFlowDiv.style.padding = "3px";
		oFlowDiv.style.position = "absolute";
	
		oFlowDiv.style.backgroundColor = "white";
//		oFlowDiv.style.width = oTablePane.offsetWidth - 20;
		oFlowDiv.style.minHeight = "26px";
		oFlowDiv.style.overflow = "hidden";
	
		oTablePane.linkedDiv = oFlowDiv;
		oTablePane.onscroll = table_doTablePaneScroll;
	
		var oFlowTable = window.document.createElement("TABLE");
		oFlowDiv.appendChild(oFlowTable);
		oFlowDiv.m_headTable = oFlowTable;

		oFlowTable.cellPadding = 0;
		oFlowTable.cellSpacing = 0;
		oFlowTable.border = 0;
	
		var oFlowHead = window.document.createElement("THEAD");
		oFlowTable.appendChild(oFlowHead);
	
		var oFlowTR = window.document.createElement("TR");
		oFlowHead.appendChild(oFlowTR);
	
		for (var i = 0; i < element.table.columns.length; i++)
		{
			var oColumn = element.table.columns[i];
//			if (getColumnTypeIsSuppressed(oColumn.typeName)) // false
//				continue;
			
			var oFlowTD = window.document.createElement('TD');

			oFlowTD.className = 'aqds_caption';
			oFlowTD.realTD = oColumn.realTD;
			oFlowTD.column = oColumn;
			oFlowTD.noWrap = true;

			element.m_Captions.push(oFlowTD);
			oFlowTR.appendChild(oFlowTD);

			oColumn.m_caption = oFlowTD;
			// captions creation moved from here
		}

		table_UpdateColumnsPosition(element);
	}
}

function table_UpdateColumnsPosition(element)
{
	var oTablePane = element.rootDiv.tablePane;
	if (oTablePane == null) return;

	var oFlowDiv = oTablePane.linkedDiv;
	if (oFlowDiv == null) return;

	var _delta = c_InnerPadding - 1;
	if ((oTablePane.clientHeight - 6) < oTablePane.m_dataTable.offsetHeight)
		_delta += 18;

	{
		oFlowDiv.style.left = (getScreenX(oTablePane) + 1) + "px";
		oFlowDiv.style.top = (getScreenY(oTablePane) + 1) + "px";
		oFlowDiv.style.width = (oTablePane.offsetWidth - _delta) + "px";
	}

	var nestedObject = element.m_NestedObject;
	if (nestedObject != null && nestedObject.popupDiv != null)
	{
		nestedObject.popupDiv.style.left = getScreenX(nestedObject) + "px";
		nestedObject.popupDiv.style.top  = getScreenY(nestedObject) + "px";
		if (nestedObject.popupIFrame != null)
		{
			nestedObject.popupIFrame.style.left = nestedObject.popupDiv.style.left;
			nestedObject.popupIFrame.style.top = nestedObject.popupDiv.style.top;
		}
	}
}

var pageOverlay = null;
var hSplitter = null;
var vSplitter = null;
var currentSplitter = null;
var detachedSplitter = null;
var splittedElement = null;
var splittedTableBody = null;
var splittedElementOffset = 0;
var splittedElementSize = 0;
var splitterPosition = "0px";
var isHorizontalSplitter = false;
var table_splitters = new Array();

initializeSplitters();

function initializeSplitters()
{
	pageOverlay = document.createElement("DIV");
	pageOverlay.style.position = "absolute";
	pageOverlay.style.left = "0px";
	pageOverlay.style.top = "0px";
	pageOverlay.style.width = "5000px";
	pageOverlay.style.height = "5000px";
	pageOverlay.style.zIndex = 2000;
	pageOverlay.style.display = "none";
	document.body.appendChild(pageOverlay);
	
	try
	{
		pageOverlay.addEventListener("mousemove", onPageMouseMove, false);
		pageOverlay.addEventListener("mouseup", onPageMouseUp, false);
	}
	catch (ex) {}

	document.body.onmousemove = onPageMouseMove;
	document.body.onmouseup = onPageMouseUp;

	hSplitter = document.createElement("DIV");
	document.body.appendChild(hSplitter);
	hSplitter.style.display = "none";
	hSplitter.style.position = "absolute";
	hSplitter.style.height = c_splitterSize + "px";
	hSplitter.style.zIndex = 2001;
	hSplitter.innerHTML = "<table border='0' cellpadding='0' cellspacing='0' width='100%' style='height:" + c_splitterSize + "px'>" +
		"<tr><td style='background-color:#3080C0; height:1px;'></td></tr>" +
		"<tr><td style='background-color:#40A0F0; height:1px;'></td></tr>" +
		"<tr><td style='background-color:#3080C0; height:1px;'></td></tr>" +
		"<tr><td style='background-color:#206090; height:1px;'></td></tr>" +
		"</table>";

	vSplitter = document.createElement("DIV");
	document.body.appendChild(vSplitter);
	vSplitter.style.display = "none";
	vSplitter.style.position = "absolute";
	vSplitter.style.width = c_splitterSize + "px";
	vSplitter.style.zIndex = 2001;
	vSplitter.innerHTML = "<table border='0' cellpadding='0' cellspacing='0' height='100%' style='width:" + c_splitterSize + "px'><tr>" +
		"<td style='background-color:#3080C0; width:1px;'></td>" +
		"<td style='background-color:#40A0F0; width:1px;'></td>" +
		"<td style='background-color:#3080C0; width:1px;'></td>" +
		"<td style='background-color:#206090; width:1px;'></td>" +
		"</tr></table>";
}

function getTablePath(tableObj)
{
	var path = "";
	while (tableObj)
	{
		path += "/" + tableObj.name;
		tableObj = tableObj.parent;
	}
	return path;
}

function saveDetailsSplitterPos(element, horizontal, currentPercent)
{
	var path = getTablePath(element.table);

	for (var i = 0; i < table_splitters.length; i++)
		if (table_splitters[i].dataPath == path &&
				table_splitters[i].isHorizontal == horizontal)
		{
			table_splitters[i].percent = currentPercent;
			return;
		}


	table_splitters[table_splitters.length] = { dataPath: path, isHorizontal: horizontal, percent: currentPercent };
}

function getSavedDetailsSplitterPos(element, horizontal, currentPercent)
{
	var path = getTablePath(element.table);

	for (var i = 0; i < table_splitters.length; i++)
		if (table_splitters[i].dataPath == path &&
				table_splitters[i].isHorizontal == horizontal)
			return table_splitters[i].percent;

	return currentPercent;
}

function splitterMouseDown(e, splitter, horizontal)
{
	isHorizontalSplitter = horizontal;
	currentSplitter = splitter;
	splittedElement = splitter.parentNode.tableElement;
	splittedTableBody = splittedElement.rootTable.tBodies[0];

	if (horizontal)
	{
		detachedSplitter = hSplitter;
		detachedSplitter.style.width = splitter.offsetWidth + "px";
		splittedElementOffset = getScreenY(splittedTableBody);
		splittedElementSize = splittedTableBody.offsetHeight;
	}
	else
	{
		detachedSplitter = vSplitter;
		detachedSplitter.style.height = splitter.offsetHeight + "px";
		splittedElementOffset = getScreenX(splittedTableBody) - 1;
		splittedElementSize = splittedTableBody.offsetWidth;
	}

	splitterMinPos = splittedElementOffset + (horizontal ? c_minHeight : c_minWidth);
	splitterMaxPos = splittedElementOffset + splittedElementSize - (horizontal ? c_minHeight : c_minWidth) - c_splitterSize;

	pageOverlay.style.display = "";

	detachedSplitter.style.left = getScreenX(splitter) + "px";
	detachedSplitter.style.top = getScreenY(splitter) + "px";
	detachedSplitter.style.display = "";

	splitterPosition = (horizontal ? detachedSplitter.style.top : detachedSplitter.style.left);

	try { e.preventDefault(); } catch (ex) {}
}

function onPageMouseMove(e)
{
	if (!currentSplitter) return;

	if (!e) e = window.event;

	var pos = (isHorizontalSplitter ? e.clientY : e.clientX);
	if (pos < splitterMinPos) pos = splitterMinPos;
	else if (pos > splitterMaxPos) pos = splitterMaxPos;

	if (isHorizontalSplitter)
		detachedSplitter.style.top = pos - 2 + "px";
	else
		detachedSplitter.style.left = pos - 2 + "px";

	return false; // for IE
}

function onPageMouseUp()
{
	if (!currentSplitter) return;

	pageOverlay.style.display = "none";

	currentSplitter = null;

	var newPos = (isHorizontalSplitter ? detachedSplitter.style.top : detachedSplitter.style.left);

	if (splitterPosition == newPos)
	{
		detachedSplitter.style.display = "none";
		return;
	}

	newPos = parseInt(newPos);
	var newPercent = (newPos - splittedElementOffset) / splittedElementSize;

	if (isHorizontalSplitter)
		splittedElement.rootDiv.m_h_percent = newPercent;
	else
		splittedElement.rootDiv.m_w_percent = newPercent;

	if (splittedElement.detailsDiv && splittedElement.detailsHead && splittedElement.detailsVisible == false)
		detailsHeadToggle(splittedElement);

	saveDetailsSplitterPos(splittedElement, isHorizontalSplitter, newPercent);
	doWindowResize();

	detachedSplitter.style.display = "none";
}

function table_CreateRootFrame(element)
{
	var hasNestedData = getHasNestedData(element);
	var nestedDataIsPlain = getNestedDataIsPlain(element);
	var colSpan = 2 + (c_ShowSplitters ? 1 : 0);

	// Create a root table
	var oTable = window.document.createElement("TABLE");
	element.appendChild(oTable);
	element.rootTable = oTable;
	element.filtered = false;

	if (element.showCaption != false)
	{
		oTable.className = "singleFrame";
	}

	oTable.cellPadding = 0;
	oTable.cellSpacing = 0;
	oTable.border = 0;

	oTable.style.width = element.offsetWidth + "px";
	oTable.style.height = element.offsetHeight + "px";
	
	if (element.showCaption != false)
	{
		// Create a table caption
		var oHead = window.document.createElement("THEAD");
		oTable.appendChild(oHead);
		
		var oTR = window.document.createElement("TR");
		oHead.appendChild(oTR);
		
		var oTD = window.document.createElement("TD");
		oTD.colSpan = colSpan;
		oTR.appendChild(oTD);

		oTD.className = "cellCaption"; 
		oTD.innerText = element.table.caption;
	}

	// Create a table body
	var oBody = window.document.createElement("TBODY");
	oTable.appendChild(oBody);
    
	var oTableTR = window.document.createElement("TR");
	oBody.appendChild(oTableTR);
	
	oTD = window.document.createElement("TD");
	oTD.style.verticalAlign = "top";

	var percent = 1;

//	if (hasNestedData == true && nestedDataIsPlain == false)
	if (element.table.nestedDataCount > 0)
	{
		if (element.table.nestedDataCount == 1)
			percent = 0.65;
		else
			percent = 1 / (element.table.nestedDataCount + 1);
		oTD.colSpan = colSpan;
	}
	oTableTR.appendChild(oTD);

	// Create an inner placeholder
	var oDiv = window.document.createElement("DIV");
	if (!element.noFrame)
		oDiv.style.padding = c_InnerPadding + "px";
	oDiv.style.width = "100%";
	oDiv.style.height = "100%";
	oDiv.id = "rootdiv" + element.table.nestedDataCount;
	oTD.appendChild(oDiv);

	element.rootDiv = oDiv;

	element.rootDiv.m_h_percent = percent;
	element.rootDiv.m_w_percent = 1;

	if (hasNestedData == true)
	{
		if (element.detailsDiv == null)
		{
			// Create details placeholder
			if (nestedDataIsPlain == false)
			{
				if (c_ShowSplitters)
				{
					oTR = window.document.createElement("TR");
					oBody.appendChild(oTR);
					oTD = window.document.createElement("TD");
					oTR.appendChild(oTD);
					oTD.innerHTML = "<table class='noprint' border='0' cellpadding='0' cellspacing='0' width='100%' height='" + c_splitterSize + "px' onmousedown='splitterMouseDown(event, this, true)'>" +
						"<tr><td style='background-color:#BBBBBB; height:1px;'></td></tr>" +
						"<tr><td style='background-color:#CCCCCC; height:1px;'></td></tr>" +
						"<tr><td style='background-color:#BBBBBB; height:1px;'></td></tr>" +
						"<tr><td style='background-color:#AAAAAA; height:1px;'></td></tr>" +
						"</table>";
					oTD.style.cursor = "n-resize";
					oTD.tableElement = element;
					oTD.colSpan = colSpan;
					element.splitter = oTD;
				}

				oTR = window.document.createElement("TR");
				oTR.className = "noprint";
				oBody.appendChild(oTR);
			} else {
				oTR = oTableTR;

				if (c_ShowSplitters)
				{
					oTD = window.document.createElement("TD");
					oTR.appendChild(oTD);
					oTD.innerHTML = "<table class='noprint' border='0' cellpadding='0' cellspacing='0' height='100%' width='" + c_splitterSize + "px'  onmousedown='splitterMouseDown(event, this, false)'><tr>" +
						"<td style='background-color:#BBBBBB; width:1px;'></td>" +
						"<td style='background-color:#CCCCCC; width:1px;'></td>" +
						"<td style='background-color:#BBBBBB; width:1px;'></td>" +
						"<td style='background-color:#AAAAAA; width:1px;'></td>" +
						"</tr></table>";
					oTD.style.cursor = "e-resize";
					oTD.tableElement = element;
					element.splitter = oTD;
				}
			}
			
			oTD = window.document.createElement("TD");
			if (nestedDataIsPlain) { 
				oTD.width = "30%";
				oTD.style.padding = c_InnerPadding + "px";
				element.rootDiv.m_w_percent = getSavedDetailsSplitterPos(element, false, 0.7);

				var oDivHead = window.document.createElement("DIV");
				oDivHead.className = "singleFrame";
				oDivHead.style.width = "100%";
				oDivHead.style.height =  treeHeadHeight + "px";
				oDivHead.style.borderBottom = "0px";
				oDivHead.m_element = element;
				oDivHead.innerHTML = "<div class='cellCaption' style='overflow:hidden;'><div style='float:left; white-space:nowrap;'>Extended Information</div>" + 
					"<img src='null.gif' class='icon icon-show' onmousemove='this.className=\"icon icon-show1\"' onmouseout='this.className=\"icon icon-show\"' " +
					"style='float:right; margin:1px 3px 3px 1px; cursor:pointer;' onclick='detailsHeadBtnClick(this)' alt='Hide'></div>";
				oTD.appendChild(oDivHead);

				var oDivHead2 = window.document.createElement("DIV");
				oDivHead2.className = "singleFrame";
				oDivHead2.style.display = "none";
				oDivHead2.style.width = treeHeadWidth + "px";
				oDivHead2.style.height =  "100%";
				oDivHead2.m_element = element;
				oDivHead2.innerHTML = "<img src='null.gif' class='icon icon-hide' onmousemove='this.className=\"icon icon-hide1\"' " +
					"onmouseout='this.className=\"icon icon-hide\"' style='margin:3px; cursor:pointer;' " +
					"onclick='detailsHeadBtnClick(this)' alt='Show'><div class='details_caption_vertical'>Extended Information</div>";
				oTD.appendChild(oDivHead2);

				element.detailsVisible = true;
				element.detailsHead = oDivHead;
				element.detailsHead2 = oDivHead2;
			} else {
				oTD.colSpan = colSpan;
				element.detailsHead = null;
			}
			oTD.className = "detailsBody noprint";
			oTD.style.verticalAlign = "top";
			oTR.appendChild(oTD);

			if (!nestedDataIsPlain)
			{
				oDiv = document.createElement("DIV");
				oDiv.id = "detailsTabsDiv_" + oTR.uniqueID;
				oDiv.innerText = _nbsp;
				//oDiv.style.height = "21px";
				oTD.appendChild(oDiv);
				element.detailsTabsDiv = oDiv;
			}
		 
			oDiv = window.document.createElement("DIV");
			if (nestedDataIsPlain) { oDiv.className = "singleFrame"; oDiv.style.borderTop = "0px"; }
			oDiv.style.width = (nestedDataIsPlain ? "100%" : "100%");
			oDiv.style.height = "100%";
			oDiv.style.padding = (nestedDataIsPlain ? 0 : c_InnerPadding) + "px";
			oDiv.style.overflow = "hidden";
			oDiv.style.backgroundColor = "white";
			oTD.appendChild(oDiv);

			element.detailsDiv = oDiv;
			element.detailsDiv.id = "detailsDiv" + element.table.nestedDataCount;

			table_initializeDetails(element);
		}
	} else {

		element.detailsDiv = null;
	}
	
	element.doResize = function(_Width, _Height, details_Width, details_Height)
	{
		var pad2 = c_InnerPadding * 2;
		var splitterSize = (c_ShowSplitters ? c_splitterSize : 0);

		var h0 = _Height;
		if (this.showCaption) h0 -= 21;
		var h = h0;
		if (this.showCaption) h = Math.round(h0 * this.rootDiv.m_h_percent);

		var dWidth = 0;
		var dHeight = 0;

		var haveHead = this.detailsDiv && this.detailsHead;
		var headVisible = haveHead ? this.detailsVisible : false;
		var headHeight = headVisible ? this.detailsHead.offsetHeight : 0;

		if (this.showCaption || this.table.nestedDataCount == 0)
		{
			if (this.table.nestedDataCount > 0)
			{
				dWidth = _Width - 2;
				dHeight = h0 - h - splitterSize;
			}

			if (this.table.nestedDataCount == 0 && this.detailsDiv != null)
			{
				dWidth = Math.round(_Width * (1 - element.rootDiv.m_w_percent)) - (haveHead ? pad2 : 0) - splitterSize;
				dHeight = h - (haveHead ? treeHeadHeight - pad2 : 0);
			}
		}
		else
		{
			dWidth = details_Width;
			dHeight = details_Height;
		}

		dHeight -= (this.detailsTabsDiv ? this.detailsTabsDiv.offsetHeight : 0);
		if (dHeight < 20) dHeight = 20;

		var detailsWidth = dWidth - (haveHead ? 2 : pad2);
		var detailsHeight = dHeight - (haveHead ? headHeight + (this.table.nestedDataCount ? 2 : 1) : pad2);

		if (this.m_NestedObject != null)
		{
			if (this.m_NestedObject.doResize)
				this.m_NestedObject.doResize(detailsWidth, detailsHeight);
		}

		if (this.detailsDiv)
		{
			if (this.detailsHead) this.detailsHead.style.width = dWidth + "px";
			this.detailsDiv.style.width = dWidth + "px";
			this.detailsDiv.style.height = (dHeight - headHeight) + "px";
		}

		var rootWidth = (!haveHead || headVisible ? Math.round(_Width * element.rootDiv.m_w_percent) : _Width - treeHeadWidth - pad2 - splitterSize);
		if (!this.noFrame) rootWidth -= 2;

		if (this.rootDiv.tablePane)
		{
			this.rootDiv.tablePane.style.width = (rootWidth - (this.noFrame ? 0 : pad2)) + "px";
			this.rootDiv.tablePane.style.height = (h - (this.noFrame ? 0 : pad2) - (this.filtered ? 21 : 0) - (this.m_toolbar ? this.m_toolbar.offsetHeight : 0)) + "px";
			
			if (this.rootDiv.tablePane.m_filterDiv)
				caption_setFilterPosition(this.rootDiv.tablePane.m_filterDiv, this.rootDiv.tablePane);
		}
		this.rootDiv.style.width = rootWidth + "px";
		this.rootDiv.style.height = h + "px";

		this.rootTable.style.width = _Width + "px";
		this.rootTable.style.height = _Height + "px";

		this.style.width = _Width + "px";
		this.style.height = _Height + "px";

		if (this.m_NestedObject != null)
		{
			if (this.m_NestedObject.popupDiv != null)
			{
				this.m_NestedObject.popupDiv.style.width = detailsWidth + "px";
				if (this.m_NestedObject.popupIFrame != null)
					this.m_NestedObject.popupIFrame.style.width = detailsWidth + "px";
			}
		}
	}
	
	element.activateRowById = function(id)
	{
		if (!this.rowBody || !this.table)
			return false;

		var findItemById = function(element, item_id)
		{
			for (var i = 0; i < element.table.items.length; i++)
				if (element.table.items[i].id == item_id)
					return i;
			return -1;
		}

		var findRowByRecordId = function(rows, id)
		{
			var len = rows.length;
			var result = -1;
			
			for (var i = 0; i < len; i++)
			{
				var oTR = rows[i];
				if (oTR.cellData[0].recordID == id)
				{
					if (!oTR.opened && oTR.m_treeImage)
						oTR.m_treeImage.click();

					return i;
				}
			}
			return result;
		}

		var rowPath = [];
		var currentId = id;
		while (currentId >= 0)
		{
			var rowIndex = findItemById(this, currentId);
			if (rowIndex < 0)
				break;
			rowPath.push(rowIndex);
			currentId = this.table.items[rowIndex].pid;
		}
		
		if (rowPath.length == 0)
			return false;

		var foundRowIndex = -1;
		var rows = this.rowBody.rows;
		while (rowPath.length)
		{
			foundRowIndex = findRowByRecordId(rows, rowPath.pop());
			if (foundRowIndex < 0)
				return false;
		}
		
		if (!m_arrowKeysCapturedBy)
			m_arrowKeysCapturedBy = this;

		rows[foundRowIndex].style.display = ""; // to override filter
		table_activateRow(this, foundRowIndex, true);
		var element = this;
		window.setTimeout(function () { table_resizeCaptions(element); }, 5);
		return true;
	}

	element.findNextError = function(fromTop, statusText)
	{
		if (!this.rowBody || !this.table || !this.table.typeDescriptionColumnIndex)
			return false;

		var inspectRows = function(rows, column_index, from_top, from_row)
		{
			var len = rows.length;
			var result = -1;
			
			for (var i = from_top ? 0 : from_row; i < len; i++)
			{
				var oTR = rows[i];
				if (oTR.cellData[column_index].cellValue == statusText)
				{
					if (!oTR.opened && oTR.m_treeImage)
						oTR.m_treeImage.click();

					var subRows = oTR.subRows;
					if (subRows && subRows.length)
					{
						var sub_result = inspectRows(subRows, column_index, true, 0);
						if (sub_result >= 0)
							result = sub_result;
					}

					if (from_top || i > from_row)
					{
						if (result < 0)
							result = oTR.rowIndex - 1;
						break;
					}
				}
			}
			return result;
		}
		
		var rows = this.rowBody.rows;
		var foundRowIndex = inspectRows(rows, this.table.typeDescriptionColumnIndex - 1, fromTop, this.m_activeRow ? this.m_activeRow.rowIndex - 1 : 0);
		if (foundRowIndex < 0)
			return false;

		if (!m_arrowKeysCapturedBy)
			m_arrowKeysCapturedBy = this;

		rows[foundRowIndex].style.display = ""; // to override filter
		table_activateRow(this, foundRowIndex, true);
		var element = this;
		window.setTimeout(function () { table_resizeCaptions(element); }, 5);
		return true;
	}

	if (element.detailsDiv != null)
		element.doResize(element.offsetWidth, element.offsetHeight, element.detailsDiv.offsetWidth, element.detailsDiv.offsetHeight);
	else
		element.doResize(element.offsetWidth, element.offsetHeight, 0, 0);
}

function detailsHeadBtnClick(btn)
{
	var parent = btn;
	while (parent != null && parent.m_element == null) parent = parent.parentNode;
	if (parent == null) return;
	var element = parent.m_element;
	detailsHeadToggle(element);
}

function detailsHeadToggle(element)
{
	var width = element.offsetWidth;
	var height = element.offsetHeight;
	element.detailsVisible = !element.detailsVisible;
	element.detailsHead.style.display = element.detailsVisible ? "" : "none";
	element.detailsDiv.style.display = element.detailsVisible ? "" : "none";
	element.detailsHead2.style.display = element.detailsVisible ? "none" : "";

	element.doResize(width, height, 0, 0);
	table_UpdateColumnsPosition(element);
}

function FilterObject(value, compare_value, description)
{
	this.value = value;
	this._value = compare_value;
	this.checked = true;
	this.description = description;
}

function table_ClearFilter(element)
{
	for (var i = 0; i < element.table.columns.length; i++)
	{
		var oc = element.table.columns[i];
		while (oc.filterList.length > 0)
		{
			var fo = oc.filterList.pop();
			fo = null;
		}
	}
}

var _nbsp = String.fromCharCode(160); // 0x0160 - nbsp
function table_AddToFilter(column, value, description)
{
	if (value == "" || value == "&nbsp;" || value == _nbsp)
		value = "&lt;Empty&gt;";

	table_FindOrInsertFilterObject(column.filterList, value, column.isNumeric, true, description);
	
	return value;
}

function table_FindOrInsertFilterObject(filterList, value, isNumeric, doInsert, description)
{
	var _len = filterList.length;
	var index = 0, _compare = 0;

	var _value = value;
	if (isNumeric)
		_value = parseFloat(value.replace(",", "."));
	else
		_value = value.toLowerCase();

	if (_len > 0)
	{
		var step = Math.round(_len / 2);
		index = step - 1;
		var zz = _len > 1 ? 2 : 1; var zz2 = 2; // Max iterations
		while (zz2 < _len) { zz ++; zz2 *= 2; }
		
		for (;;)
		{
			var _filter = filterList[index]._value;

			_compare = table_textCompare(_value, _filter);
			if (_compare == 0)
				return filterList[index];

			zz --; if (zz <= 0) break;
			step = Math.round(step / 2);
			index += step * _compare;
			if (index < 0) index = 0;
			if (index >= _len) index = _len - 1;
		}
	}
	
	if (!doInsert) return null;
	
	var fo = new FilterObject(value, _value, description);
	if (_compare > 0) index += _compare;
	if (_len == 0 || index == _len)
		filterList.push(fo);
	else
		filterList.splice(index, 0, fo);
	return fo;
}

function table_msecToString(t, fullTime)
{
	var sign = t < 0 ? "-" : "+";
	t = Math.abs(t);
	var dimValue = !fullTime && (t < c_DimSmallTimeDifferenceMs);
	t = Math.round(t / 100);
	var result = (t >= 864000 /* one day */ ? Math.floor(t / 864000) + "." : "");
	var h = Math.floor(t / 36000);
	var m = Math.floor(t % 36000 / 600);
	var s = Math.floor(t % 600 / 10);
	var ms = Math.round(t % 10);
	if (fullTime) result = " ";
	if (h > 0 || result.length > 0) result += ((h < 10 && result.length > 0) ? "0" : "") + h + ":";
	if (m > 0 || result.length > 0) result += ((m < 10 && result.length > 0) ? "0" : "") + m + ":";
	result += ((s < 10 && result.length > 0) ? "0" : "") + s + (fullTime ? "" : ("." + ms));
	if (!fullTime) result = sign + " " + result;
	if (dimValue) result = "<span style='color:silver'>" + result + "</span>";
	return result;
}

function table_CreateRows(element, parentRow, parentid, level)
{
	var resultRows = new Array();
	var globalIndent = 5 + level * 16;
	var data_is_tree = false; //nety_nodes.length > 0;
	for (var i = 0; i < element.table.items.length; i++)
		if (element.table.items[i].nety) { data_is_tree = true; break; }
	var basePath = correctLocation(element.location, "");

	var oColumns = element.table.columns;
	var columns_length = oColumns.length;

	var rows = [];
	for (var i = 0; i < element.table.items.length; i++)
		if (element.table.items[i].pid == parentid)
			rows.push(element.table.items[i]);

	var rows_length = rows.length;
	var statusRowCount = element.totalRowCount;
	if (c_StatusProgress && statusRowCount == 0)
	{
		element.loadedRowCount = 0;
		statusRowCount = rows_length;
	}

	var _status = window.status;
	for (var i = 0; i < rows_length; i++)
	{
		if (c_StatusProgress)
		{
			element.loadedRowCount++;
			if (element.loadedRowCount % 50 == 0)
			{
				var percent = Math.round(element.loadedRowCount * 100 / statusRowCount);
				window.status = 'Loading data... (' + percent + '%)';
			}
		}

		var oRow = rows[i];
		if (element.loadTreeAtOnce || parentRow == null)
		{
			var oTR = document.createElement("TR");
			element.rowBody.appendChild(oTR);
		}
		else
		{
			var oTR = element.rowBody.insertRow(parentRow.rowIndex+i);
		}

		resultRows.push(oTR);

		oTR.subRows = null;
		oTR.parentRow = parentRow;
		oTR.defaultColumn = null;
		oTR.onclick = table_doShowNestedData;
		oTR.tableElement = element;
		oTR.style.cursor = m_PointerCursor;
		oTR.filtered = false;
		oTR.mustBeVisible = true;
		oTR.cellData = [];
		oTR.m_linkTabs = [];
		
		var rowColor = oRow.color;
		var rowBgColor = oRow.bcolor;
		var rowBold = oRow.bold || false;
		var rowItalic = oRow.italic || false;
		var rowUnderline = oRow.underline || false;
		var rowStrikeout = oRow.strikeout || false;

		if (rowColor != null) oTR.style.color = rowColor;
		if (rowBgColor != null) oTR.style.backgroundColor = rowBgColor;
		oTR.m_bgColor = rowBgColor;

		if (level > 0 && !parentRow.opened)
			oTR.style.display = "none";
		
		var row_nety = (oRow.nety || false);
		oTR.row_nety = row_nety;

		var currentRecordId = oRow.id || 0;

		var firstColumn = true;
		for (var j = 0; j < columns_length; j++)
		{
			var oColumn = oColumns[j];
			var oRowCell = oRow[oColumn.name];
			
			var nodeValue = "";
			if (typeof(oRowCell) != "undefined")
				nodeValue = "" + (typeof(oRowCell) == "object" ? oRowCell.text : oRowCell);
			var colTypeName = oColumn.typeName;

			oTR.cellData[j] = { cellValue: (oColumn.isComplex ? basePath : "") + nodeValue, recordID: currentRecordId };

			if (oColumn.isComplex)
			{
				if (oTR.defaultColumn == null)
				  oTR.defaultColumn = oColumn;

				if (colTypeName == "aqds:pictures") {

					var pictureCount = 0;
					if (typeof(oRowCell) != "undefined" && typeof(oRowCell.length) != "undefined")
					{
						pictureCount = oRowCell.length || 0;
						oTR.cellData[j].pictureCount = pictureCount;
						oTR.cellData[j].pictures = oRowCell;
					}
					if (pictureCount == 1)
						oTR.cellData[j].cellValue = basePath + oRowCell[0].filename;
					else
						oTR.cellData[j].cellValue = null;

					oTR.cellData[j].location = element.location;

				} else if (colTypeName == "aqds:text") {
					if (nodeValue != "")
						oTR.cellData[j].isFileName = oRowCell.isfilename;

					oTR.cellData[j].cellValue = nodeValue;

				} else if (colTypeName == "aqds:table") {
					oTR.cellData[j].items = oRowCell ? oRowCell.items : oColumn.items;
				}

				continue;
			}
			else if (colTypeName == "aqds:float" && oRowCell.toFixed) {
				nodeValue = oRowCell.toFixed(2);
			}

			var oTD = document.createElement("TD");

			oTD.className = "cellValue";
			oTD.noWrap = true; // Important for Firefox

			if (rowBold) oTD.style.fontWeight = "bold";
			if (rowItalic) oTD.style.fontStyle = "italic";
			if (rowUnderline) oTD.style.textDecoration = "underline";
			if (rowStrikeout) oTD.style.textDecoration += " line-through";

			oTD.recordID = currentRecordId;
			oTR.appendChild(oTD);

			oTD.filterText = "";

			if (firstColumn)
			{
				firstColumn = false;	
				oTD.parentRow = parentRow;
				oTD.level = level;

				if (data_is_tree)
				{
				if (row_nety)
				{
					oTD.image = createTreeImage(false);
					oTD.image.parentTD = oTD;
					oTD.image.onclick = table_expandRow;
				} else {

					oTD.image = createTreeImageDummy();
				}
				oTD.image.style.marginLeft = "0px";
				oTD.image.style.marginRight = "5px";
				oTD.image.style.marginBottom = "2px";
				oTD.appendChild(oTD.image);
				oTD.style.paddingLeft = globalIndent + "px";
				oTR.m_treeImage = oTD.image;
				}
			}

			{
				var oSpan = oTD;
				if (firstColumn && data_is_tree || colTypeName == "aqds:image")
				{
					oSpan = document.createElement("SPAN");
					oTD.appendChild(oSpan);
				}

				if (colTypeName == "aqds:image")
				{
					oTD.vAlign = "top";
					if (nodeValue != "")
					{
						var nodeDescription = nodeValue;
						if (nodeValue.indexOf(".") < 0)
							oSpan.innerHTML = "<img src=\"null.gif\" border=\"0\" class=\"icon icon-" + nodeValue.toLowerCase().replace(/\s/g, '-') + "\" style=\"position: relative; top:1px;\"/>";
						else
						{
							nodeDescription = "";
							oSpan.innerHTML = "<img src=\"" + (basePath + nodeValue) + "\" border=\"0\" style=\"position: relative; top:1px;\"/>";
						}
					}
					else
						oSpan.innerText = _nbsp;

					oTD.filterText = table_AddToFilter(oColumn, oSpan.innerHTML, nodeDescription);

				} else if (colTypeName == "aqds:hyperlink") {

					oTR.cellData[j].cellValue = null;
					oTR.cellData[j].location = element.location;

					if (nodeValue != "") {
					
						if (!table_isInternalURL(nodeValue))
						{
							var isExternalLink = false;
							var protocolDelimiterPos = nodeValue.indexOf("://");
							var linkProtocol = (protocolDelimiterPos > 0 ? nodeValue.toLowerCase().substring(0, protocolDelimiterPos) : "");
							for (var p = 0; p < c_ExternalLinkProtocols.length; p++) { if (linkProtocol == c_ExternalLinkProtocols[p]) { isExternalLink = true; break; } }

							oTR.cellData[j].cellValue = (isExternalLink ? "" : basePath) + nodeValue;
							oSpan.innerHTML = "<SPAN class='linkCell' onclick='table_doShowNestedData(this)'>" + nodeValue + "</SPAN>";
							if (oTR.defaultColumn == null)
							  oTR.defaultColumn = oColumn;
						}
						else
							oSpan.innerHTML = nodeValue;
							
					} else {
					
						oSpan.innerText = _nbsp;
					}

					oTD.columnIndex = j;
				
				} else {
					if (oColumn.isDateTime)
					{
						var msec = oRowCell.msec;
						if (msec != undefined && msec > 31536000000 /* one year */)
						{
							oTR.cellData[j].msec = msec;
							oTR.cellData[j].value = nodeValue;
						}
					}

					if (nodeValue == "")
						oSpan.innerText = _nbsp;
					else
					{
						if (nodeValue.indexOf("&") > 0 || nodeValue.indexOf("<") > 0 || nodeValue.indexOf(">") > 0)
							nodeValue = nodeValue.replace(/[&]/g, "&amp;").replace(/[<]/g, "&lt;").replace(/[>]/g, "&gt;");

						oSpan.innerHTML = "<pre style='margin:0px; padding-top:1px;" + ((oColumn.isDateTime || oColumn.isNumeric) ? " text-align:right;" : "") + "'>" + nodeValue + "</pre>";
					}
					oTD.filterText = table_AddToFilter(oColumn, nodeValue);

					if (oColumn.isDateTime)
						oSpan._msec = oRowCell.msec;
				}
				oTD.column = oColumn;
			}
		}
		
		if (parentRow && parentRow.opened) table_checkRowIsFiltered(oTR, element.textToSearch);

		// Reading subrows
		if (row_nety)
		{
			element.isTree = true;
			oTR.recordId = currentRecordId;
			oTR.level = level;
			if (element.loadTreeAtOnce) table_getSubRows(oTR);
		}
	}

	if (c_StatusProgress && level == 0) window.status = _status;

	return resultRows;
}

function table_getSubRows(row)
{
	if (!row || !row.tableElement || row.subRows != null) return;

	row.subRows = table_CreateRows(row.tableElement, row, row.recordId, row.level + 1);
	if (row.subRows.length == 0)
		hideTreeImage(row.m_treeImage);
}

function table_OperaForceRedraw(element, opera9too)
{
	// Bug in Opera - incorrect redraw of table rows and invisible scroller

	if (!isOpera) return;
	if (opera9too)
	{
		var tablePane = element.rootDiv.tablePane;
		var delta = 1;
		if (tablePane.scrollLeft > 0) delta = -1;
		tablePane.scrollLeft += delta;
		if (tablePane.scrollLeft > 0)
		{
			tablePane.scrollLeft -= delta;
		}
		else
		{
			tablePane.m_dataTable.width -= 1;
			tablePane.m_dataTable.width += 1;
		}
	}
}

function table_setActiveRow(element, newRow, keepNestedObject)
{
	if (element.m_activeRow != null)
	{
		element.m_activeRow.className = "";
		element.m_activeRow.style.backgroundColor = element.m_activeRow.m_bgColor;

		for (var i = 0; i < element.m_activeRow.m_linkTabs.length; i++)
			element.m_activeRow.m_linkTabs[i].remove();

		element.m_activeRow.m_linkTabs = [];
	}

	if (!keepNestedObject && element.m_NestedObject != null)
	{
		element.detailsDiv.innerHTML = "";
		table_clear(element.m_NestedObject);
		text_clear(element.m_NestedObject);
		element.m_NestedObject = null;
	}

	if (element.detailsDiv)
		element.detailsDiv.style.overflow = "";

	element.m_activeRow = newRow;

	if (element.m_activeRow != null)
	{
		element.m_activeRow.style.backgroundColor = "";
		element.m_activeRow.className = "selectedRow";
		table_OperaForceRedraw(element, false);
	}
}

function table_onDetailsTabSelect(tab, prevTab)
{
	if (!prevTab)
		return;

	var element = tab.tabsObject.parent;
	element.m_NestedObject = tab.tabItem;
	element.activeDetailsTabName = tab.tabsObject.names[tab.tabItemIndex];
	if (element.m_NestedObject.init)
		table_updateNestedData(element, element.m_activeRow);
	doWindowResize();
}

function table_initializeDetails(element)
{
	var tabs = null;
	if (element.detailsTabsDiv)
	{
		tabs = new TabsObject(element.detailsTabsDiv.id, table_onDetailsTabSelect, element, element.activeDetailsTabName);
		element.detailsTabsDiv.m_tabsObject = tabs;
	}

	var firstItem = null;
	for (var i = 0; i < element.table.columns.length; i++)
	{
		var column = element.table.columns[i];
		var nestedObject = null;

		if (column.typeName == "aqds:text")
		{
			nestedObject = document.createElement("DIV");
			nestedObject.init = text_load;
		}
		else if (column.typeName == "aqds:table")
		{
			nestedObject = document.createElement("DIV");
			nestedObject.init = table_setActive;

			nestedObject.table = column;
			nestedObject.location = element.location;
			nestedObject.showCaption = false;
			nestedObject.noFrame = true;
		}
		else if (column.typeName == "aqds:picture" || column.typeName == "aqds:pictures")
		{
			nestedObject = document.createElement("DIV");
			nestedObject.init = picture_load;
		}

		if (nestedObject != null)
		{
			if (firstItem)
				firstItem.style.display = "none";

			nestedObject.id = "dataTab_" + column.caption.replace(new RegExp(" ", "g"), "") + "_" + nestedObject.uniqueID;
			nestedObject.style.width = "100%";
			nestedObject.style.height = "100%";
			
			nestedObject.columnIndex = i;

			element.detailsDiv.appendChild(nestedObject);

			if (firstItem)
				nestedObject.style.display = "none";
			else
				firstItem = nestedObject;

			if (!element.m_NestedObject)
				element.m_NestedObject = nestedObject;

			if (tabs)
				tabs.addItem(column.caption, nestedObject.id);
		}
	}

	if (tabs)
		tabs.render();
}

function table_updateNestedData(element, oTR)
{
	if (!element || !oTR)
		return;

	var tabs = element.detailsTabsDiv ? element.detailsTabsDiv.m_tabsObject : null;
	var nestedObject = (tabs && tabs.activeTab) ? tabs.activeTab.tabItem : element.m_NestedObject;
	
	if (!nestedObject)
		return;
	
	var cell = oTR.cellData[nestedObject.columnIndex];
	var column = element.table.columns[nestedObject.columnIndex];
	
	nestedObject.value = cell.cellValue;

	if (column.typeName == "aqds:text")
	{
		if (cell.cellValue == "")
		{
			nestedObject.textObject = null;
		}
		else if (column.textObject)
		{
			nestedObject.textObject = column.textObject;
			nestedObject.location = element.location;
			nestedObject.isFileName = cell.isFileName;
		}
		nestedObject.init(nestedObject, element);
	}
	else if (column.typeName == "aqds:picture" || column.typeName == "aqds:pictures")
	{
		if (cell.pictureCount > 1)
		{
			nestedObject.table = column;
			nestedObject.pictures = cell.pictures;
			nestedObject.location = element.location;
		}
		else
			nestedObject.table = null;
		nestedObject.init(nestedObject, element);
	}
	else if (column.typeName == "aqds:table")
	{
		if (!nestedObject.table.syncRecords || !nestedObject.loaded)
		{
			nestedObject.table.items = cell.items;
			nestedObject.init(nestedObject, element);
			nestedObject.loaded = true;
		}

		if (nestedObject.table.syncRecords)
			table_activateRow(nestedObject, oTR.rowIndex-1, true);
	}
}

function table_doShowNestedData(link)
{
	var oTD, oTR, element;

	if (link && link.parentNode) // link clicked
	{
		oTD = link.parentNode;
		oTR = oTD.parentNode;
		element = oTR.tableElement;
		var caption = oTD.column.caption;

		if (!element.detailsDiv || !element.detailsTabsDiv)
			return;

		element.preventDefault = true;
		
		if (oTR != element.m_activeRow)
			table_setActiveRow(element, oTR, true);
		
		var tabs = element.detailsTabsDiv.m_tabsObject;
		
		for (var i = 0; i < oTR.m_linkTabs.length; i++)
		{
			var tabIndex = oTR.m_linkTabs[i].tabItemIndex;
			if (tabs.names[tabIndex] == caption)
			{
				tabs.activateTabByIndex(tabIndex);
				return;
			}
		}

		var cell = oTR.cellData[oTD.columnIndex];
		var url = cell.cellValue;
		if (table_isInternalURL(url)) return;

		var loc = isIE ? "probably.mht" : "";
		try { loc = document.location.href; } catch (e) { }

		var show_content = false;
		var dot = url.lastIndexOf(".");
		var ext = "";
		if (dot > 0)
		{
			ext = url.substring(dot + 1);
			for (var j = 0; j < c_ShowContentForExtensions.length; j++)
				if (c_ShowContentForExtensions[j] == ext) { show_content = true; break; }
		}
		var MHT_XML = (ext == "xml") && (loc.indexOf(".mht") == loc.length - 4);

		var iframe = window.document.createElement("IFRAME");
		iframe.frameBorder = 0;
		iframe.width = "100%";
		iframe.height = "100%";
		iframe.style.zIndex = 100;
		iframe.src = (MHT_XML || !show_content) ? "about:blank" : url;

		var nestedObject = document.createElement("DIV");
		nestedObject.id = "linkDiv_" + nestedObject.uniqueID;
		nestedObject.style.height = "100%";
		nestedObject.appendChild(iframe);
		element.detailsDiv.appendChild(nestedObject);

		if (tabs)
		{
			tabs.addItem(caption, nestedObject.id);
			tabs.initialActiveTabName = caption;
			tabs.render();
			
			oTR.m_linkTabs.push(tabs.getTabByIndex(tabs.items.length-1));
		}

		table_showLinkPopup(cell, MHT_XML, show_content, nestedObject);
		return;
	}
	else // row clicked
	{
		if (!this.defaultColumn)
		{
			if (this.tableElement)
			{
				var m_NestedObject = this.tableElement.m_NestedObject;
				if (m_NestedObject != null)
				{
					if (m_NestedObject.parentNode && m_NestedObject.parentNode.innerHTML)
						m_NestedObject.parentNode.innerHTML = "";
					this.tableElement.m_NestedObject = null;
				}
				table_setActiveRow(this.tableElement, this, true);
			}
			return;
		}

		oTR = this;
		element = this.tableElement;

		if (element.preventDefault)
		{
			element.preventDefault = false;
			return;
		}
	}

	table_setActiveRow(element, oTR, true);

	table_updateNestedData(element, oTR);
}

function table_doShowLink(MHT_XML, location, url)
{
	if (MHT_XML)
	{
		var _xml = _load_XML(url);
		if (!_xml)
		{
			alert('Unable to load XML file');
			return;
		}

		var _xsl = _load_XML(changeFileExt(url, "xsl"));
		if (!_xsl)
		{
			// try to find xsl link in the loaded xml file
			for (var i = 0; i < _xml.childNodes.length; i++)
			{
				if (_xml.childNodes[i].nodeName.toLowerCase() != "xml-stylesheet") continue;
				var value = _xml.childNodes[i].nodeValue;
				var pos = value.indexOf(".xsl");
				if (pos < 0) continue;
				value = value.substring(0, pos + 4);
				var xslUrl = correctLocation(location, value.substring(value.lastIndexOf("\"") + 1));
				_xsl = _load_XML(xslUrl);
			}
		}

		if (!_xsl) // show xml as plain text
		{
			var text = "" + _xml.xml;
			var re = /</g;
			text = text.replace(re, "&lt;");
			var re = />/g;
			text = text.replace(re, "&gt;");
			document.write("<html><body><pre>" + text + "</pre></body></html>");
		}
		else // transform xml using xsl
		{
			var text = _xml.transformNode(_xsl);
			document.write(text);
			text = "" + document.body.onload;
			var pos = text.indexOf("{");
			if (pos > 0)
			{
				text = text.substring(pos + 1, text.indexOf("}"));
				eval(text);
			}
		}
	}
	else
	{
		window.open(url, "_blank", "status=yes,toolbar=no,menubar=no,location=no,scrollbars=yes");
		return;
	}
}

function table_hideLinkPopup(btn)
{
	var parent = btn.offsetParent.offsetParent.offsetParent.parentNode;
	parent.removeChild(parent.popupDiv);
	if (isIE) parent.removeChild(parent.popupIFrame);
}

function table_showLinkPopup(oTD, MHT_XML, show_content, nestedObject) // Open link in the new window
{
	var div = nestedObject || oTD.parentNode.tableElement.m_NestedObject;
	if (!div) div = oTD.parentNode.tableElement;
	var div2 = window.document.createElement("DIV");
	div2.className = "singleFrame";
	div2.style.position = "absolute";
	div2.style.left = getScreenX(div) + "px";
	div2.style.top  = getScreenY(div) + "px";
	div2.style.zIndex = 1000;
	div2.style.padding = "3px";
	div2.style.height = "21px";
	div2.style.width = (div.offsetWidth + 2) + "px";
	div2.style.backgroundColor = "#FFFFE0";

	var link = oTD.cellValue;
	if (show_content) link = "javascript:table_doShowLink(" + MHT_XML + ", \"" +
		oTD.location.replace(/\\/g, "\\\\") + "\", \"" + link.replace(/\\/g, "\\\\") + "\")";
	var blank = (!MHT_XML && !show_content ? "target='_blank'" : "");

	var html = "<TABLE cellpadding=0 cellspacing=0 width='100%'><TR><TD>&nbsp;" + 
		"<A " + blank + " href='" + link + "'>Open link in " + (MHT_XML ? "the main" : "a new") + " window</A></TD>" +
		(!MHT_XML ? "<TD style='width:13px;'><INPUT type='image' width=13 height=13 src='null.gif' class='icon icon-close' title='Hide' onclick='table_hideLinkPopup(this)' " +
			"onmouseover='this.className=\"icon icon-close1\"' onmouseout='this.className=\"icon icon-close\"'></TD>" : "") + "</TR></TABLE>";
	div2.innerHTML = html;
	div.appendChild(div2);
	div.popupDiv = div2;

	if (isIE)
	{
		var iframe2 = window.document.createElement("IFRAME");
		iframe2.style.position = "absolute";
		iframe2.style.left = div2.style.left;
		iframe2.style.top  = div2.style.top;
		iframe2.style.height = "22px";
		iframe2.style.width = div2.style.width;
		iframe2.style.zIndex = 999;
		iframe2.frameBorder = 0;
		iframe2.scrolling = "no";
		div.appendChild(iframe2);
		div.popupIFrame = iframe2;
	}
}

function table_isInternalURL(url)
{
	return (url.replace("  ", " ").indexOf("<a href=\"#") == 0);
}

function table_checkHeaderWidth(oTablePane)
{
	var _delta = c_InnerPadding - 1;
	if ((oTablePane.clientHeight - 6) < oTablePane.m_dataTable.offsetHeight)
		_delta += 18;
	oTablePane.linkedDiv.style.width = (oTablePane.offsetWidth - _delta) + "px";
}

function table_doTablePaneScroll()
{
	if (this.linkedDiv != null)
	{
		this.linkedDiv.scrollLeft = this.scrollLeft;
	}
	if (this.m_filterDiv != null)
	{
		caption_setFilterPosition(this.m_filterDiv, this);
	}
}

function table_expandRow()
{
	roloverTreeImage(this);
	var row = this.parentTD.parentNode;
	var element = row.tableElement;
	row.opened = this.opened;
	if (!element.loadTreeAtOnce) table_getSubRows(row);
	table_showSubRows(row, this.opened);
	table_resizeCaptions(element);
	table_checkHeaderWidth(element.rootDiv.tablePane);
	if (!element.loadTreeAtOnce) table_updateFilterState(element);
}

function table_showSubRows(row, value)
{
	if (row.subRows != null)
	{
		var _value = value;
		if (value && !row.opened && row.mustBeVisible) _value = false; // do not open closed subrows
		for (var i = 0; i < row.subRows.length; i++)
		{
			var isFolder = row.subRows[i].subRows != null && table_isSubRowsFiltered(row.subRows[i]) == false;
			var _visible = (_value && row.subRows[i].mustBeVisible);
			row.subRows[i].style.display = _visible ? "": "none";
			if (_visible) table_updateDateTimeColumns(row.subRows[i]);
			table_showSubRows(row.subRows[i], _value);
		}

		var nextRow = table_getNextVisibleRow(row.subRows.length > 0 ? row.subRows[row.subRows.length-1] : row);
		table_updateDateTimeColumns(nextRow);
	}
}

function table_resizeCaptions(element)
{
	for (var i = 0; i < element.m_Captions.length; i++)
	{
		if (!element.m_Captions[i].realTD) continue;
		element.m_Captions[i].style.width = element.m_Captions[i].realTD.offsetWidth + "px";
		element.m_Captions[i].style.minWidth = element.m_Captions[i].realTD.offsetWidth + "px";
	}
}

function table_getPreviousVisibleRow(row)
{
	while (row)
	{
		row = row.previousSibling;
		if (!row || !row.rowIndex)
			break;
		if (row.style.display != "none")
			return row;
	}
	return null;
}

function table_getNextVisibleRow(row)
{
	while (row)
	{
		row = row.nextSibling;
		if (!row)
			break;
		if (row.style.display != "none")
			return row;
	}
	return null;
}

function table_updateDateTimeColumnsForTable(table)
{
	for (var i = 0; i < table.rows.length; i++)
		if (table.rows[i].style.display != "none")
			table_updateDateTimeColumns(table.rows[i]);
}

function table_updateDateTimeColumns(row)
{
	if (c_ShowTimeDifference === undefined)
		return;
	
	var prevVisibleRow = table_getPreviousVisibleRow(row);
	if (!prevVisibleRow)
	{
		if (!c_ShowTimeDifference && row.cellData)
		{
			for (var i = 0; i < row.cellData.length; i++)
				if (row.cellData[i].msec != undefined && row.cells[i].firstElementChild)
					row.cells[i].firstElementChild.innerHTML = row.cellData[i].value;
		}
		return;
	}
	
	for (var i = 0; i < row.cellData.length; i++)
	{
		if (row.cellData[i].msec == undefined ||
			prevVisibleRow.cellData[i].msec == undefined)
			continue;
		
		if (!row.cells[i].firstElementChild)
			break;
		
		if (c_ShowTimeDifference)
			row.cells[i].firstElementChild.innerHTML = table_msecToString(row.cellData[i].msec - prevVisibleRow.cellData[i].msec);
		else
			row.cells[i].firstElementChild.innerHTML = row.cellData[i].value;
	}
}

// ------------------------------ SORTING ------------------------------

var m_SortColumnId;

function table_sort(oTable)
{
	var _prevColumnId = m_SortColumnId;
	m_SortColumnId = oTable.m_sortColumnId;

	if (oTable.rows.length < 3 || m_SortColumnId < 0) return;

	var _sortColumn = oTable.rows[0].cells[m_SortColumnId].column;

	var _sortFunction = table_sort_caseinsensitive;
	if (_sortColumn.isImage) _sortFunction = table_sort_image;
	if (_sortColumn.isNumeric) _sortFunction = table_sort_numeric;
	if (_sortColumn.isDateTime) _sortFunction = table_sort_datetime;

	var sortRows = new Array();
	for (var i = 1; i < oTable.rows.length; i++)
		sortRows[i - 1] = oTable.rows[i];

	if (_sortColumn.filterList.length > 1 || _sortColumn.isDateTime)
	{
		if (oTable.m_sortAscending) sortRows.reverse();
		sortRows.sort(_sortFunction);
		if (!oTable.m_sortAscending) sortRows.reverse();
	}
	else
	{
		if (_prevColumnId == m_SortColumnId) sortRows.reverse();
	}

	for (var i = 0; i < sortRows.length; i++) 
	{
		if (!sortRows[i].parentRow)
		{
			oTable.tBodies[0].appendChild(sortRows[i]);
			add_subRows(oTable, sortRows[i], sortRows);
		}
	}
}

function add_subRows(oTable, oRow, sortRows)
{
	if (!oRow.subRows) return;

	for (var i = 0; i < sortRows.length; i++)
	{
		for (var j = 0; j < oRow.subRows.length; j++)
			if (oRow.subRows[j] == sortRows[i])
			{
				oTable.tBodies[0].appendChild(oRow.subRows[j]);
				add_subRows(oTable, oRow.subRows[j], sortRows);
				break;
			}
	}
}

function check_image(cell)
{
	var item = null;
	var child = cell.getElementsByTagName("SPAN");
	if (child.length == 0) return item;

	child = child[0].getElementsByTagName("IMG");
	if (child.length == 0) return item;

	item = child[0].src;
	return item;
}

function table_sort_image(a, b)
{
	aa = check_image(a.cells[m_SortColumnId]); if (!aa) aa = "";
	bb = check_image(b.cells[m_SortColumnId]); if (!bb) bb = "";

	if (aa == bb) return 0;
	if (aa < bb) return -1;
	return 1;
}

function table_sort_numeric(a, b) 
{ 
	var str = a.cells[m_SortColumnId].innerText;
	var aa = parseFloat(str.replace(",", "."));
	if (isNaN(aa)) aa = 0;

	str = b.cells[m_SortColumnId].innerText;
	var bb = parseFloat(str.replace(",", "."));
	if (isNaN(bb)) bb = 0;

	return aa - bb;
}

function table_sort_datetime(a, b)
{
	var a_msec = a.cells[m_SortColumnId]._msec;
	var b_msec = b.cells[m_SortColumnId]._msec;

	var res = 0;
	if (a_msec && b_msec)
		res = table_textCompare(a_msec, b_msec);
	else
		res = table_sort_caseinsensitive(a, b);

	if (res == 0 && a.cellData && b.cellData)
		res = table_textCompare(a.cellData[0].recordID, b.cellData[0].recordID);
	return res;
}

function table_textCompare(a, b)
{
	if (a == b) return 0;
	if (a < b) return -1;
	return 1;
}

function table_sort_caseinsensitive(a, b) 
{
	var aa = a.cells[m_SortColumnId].innerText.toLowerCase();
	var bb = b.cells[m_SortColumnId].innerText.toLowerCase();

	return table_textCompare(aa, bb);
}

function table_sort_default(a, b) 
{
	aa = a.cells[m_SortColumnId].innerText;
	bb = b.cells[m_SortColumnId].innerText;

	return table_textCompare(aa, bb);
}

// ------------------------------ FILTERING ------------------------------

function table_isSubRowsFiltered(oRow)
{
	var _filtered = true;
	for (var i = 0; i < oRow.subRows.length; i++)
	{
		var oSubRow = oRow.subRows[i];
		if (oSubRow.subRows)
			_filtered = table_isSubRowsFiltered(oSubRow);
		if (oSubRow.mustBeVisible) _filtered = false;
	}
	return _filtered;
}

function options_click()
{
	table_updateFilter(this.m_dataTable);
}

function filter_remove()
{
	var columns = this.element.table.columns;
	for (var i = 0; i < columns.length; i++)
	{
		var oc = columns[i];
		if (!oc.filtered) continue;

		for (var j = 0; j < oc.filterList.length; j++)
			oc.filterList[j].checked = true;

		oc.filtered = false;
		oc.m_caption.m_captionDiv.style.fontWeight = "";
	}

	this.element.textToSearch = "";

	table_updateFilter(this.element.rootDiv.tablePane.m_dataTable);
	caption_hideFilter(m_providercell.m_filteredColumn);
}

function table_showFilterOptions(element, show)
{
	if (element.rootDiv.filterOptionsDiv != null)
	{
		if (!show)
		{
			element.filter_showParents = null;
			element.filter_showChildren = null;
			element.rootDiv.removeChild(element.rootDiv.filterOptionsDiv);
			element.rootDiv.filterOptionsDiv = null;

			element.rootDiv.tablePane.style.height = (element.rootDiv.tablePane.offsetHeight + 21) + "px";
		}
		return;
	}

	if (show)
	{
		var oTable = document.createElement("TABLE");
		element.rootDiv.appendChild(oTable);
		oTable.width = "100%";
		oTable.height = 20;
		oTable.cellPadding = 0;
		oTable.cellSpacing = 0;
		oTable.className = "singleFrame";
		oTable.style.borderTopWidth = "0px";
		oTable.style.backgroundColor = "#EEEEEE";

		var oBody = document.createElement("TBODY");
		oTable.appendChild(oBody);
		var oTR = document.createElement("TR");
		oBody.appendChild(oTR);

		// close button
		var oTD = document.createElement("TD");
		oTR.appendChild(oTD);
		oTD.width = 20;
		oTD.height = 20;
		oTD.align = "right";
		oTD.style.paddingTop = "4px";
		var oBtn = document.createElement("INPUT");
		oBtn.type = "image";
		oBtn.src = "null.gif";
		oBtn.className = "icon icon-close";
		oBtn.title = "Remove filter";
		oBtn.onmouseover = function () { this.className = 'icon icon-close1'; }
		oBtn.onmouseout = function () { this.className = 'icon icon-close'; }
		oBtn.element = element;
		oBtn.onclick = filter_remove;
		oTD.appendChild(oBtn);

		oTD = document.createElement("TD");
		oTD.style.paddingLeft = "5px";
		oTD.innerHTML = "Filter is active";
		oTR.appendChild(oTD);

		if (element.isTree) // "show parents" and "show children" checkboxes
		{
			var oTD = document.createElement("TD");
			oTR.appendChild(oTD);
			oTD.width = 20;
			var oCB1 = document.createElement("INPUT");
			oCB1.type = "checkbox";
			oCB1.m_dataTable = element.rootDiv.tablePane.m_dataTable;
			oCB1.onclick = options_click;
			oTD.appendChild(oCB1);
			element.filter_showParents = oCB1;

			oTD = document.createElement("TD");
			oTD.width = 80;
			oTD.innerHTML = "show parents";
			oTR.appendChild(oTD);

			oTD = document.createElement("TD");
			oTR.appendChild(oTD);
			oTD.width = 20;
			var oCB2 = document.createElement("INPUT");
			oCB2.type = "checkbox";
			oCB2.m_dataTable = element.rootDiv.tablePane.m_dataTable;
			oCB2.onclick = options_click;
			oTD.appendChild(oCB2);
			element.filter_showChildren = oCB2;

			oTD = document.createElement("TD");
			oTD.width = 80;
			oTD.innerHTML = "show children";
			oTR.appendChild(oTD);
		}
		
		element.rootDiv.tablePane.style.height = (element.rootDiv.tablePane.offsetHeight - 21) + "px";

		element.rootDiv.filterOptionsDiv = oTable;
	}
}

function table_checkRowIsFiltered(oRow, textToSearch)
{
	var _visible = true;
	for (var j = 0; j < oRow.cells.length; j++)
	{
		var oCell = oRow.cells[j];
		if (!oCell.column.filtered) continue;

		// Searching for value in filter list

		var fo = table_FindOrInsertFilterObject(oCell.column.filterList, oCell.filterText, oCell.column.isNumeric, false);
		if (fo != null) _visible = _visible && fo.checked;

		if (!_visible) break;
	}

	if (_visible && textToSearch)
	{
		textToSearch = textToSearch.toLowerCase();
		var _visible = false;
		for (var j = 0; j < oRow.cells.length; j++)
		{
			var oCell = oRow.cells[j];
			if (oCell.innerText.toLowerCase().indexOf(textToSearch) >= 0)
			{
				_visible = true;
				break;
			}
		}
	}

	oRow.filtered = !_visible;
	oRow.mustBeVisible = _visible;
	oRow.style.display = _visible ? "" : "none";
}

function table_updateFilter(oTable)
{
	var _table_filtered = false;

	var element = oTable.parentNode.tableElement;
	var showParents = element.filter_showParents != null && element.filter_showParents.checked;
	var showChildren = element.filter_showChildren != null && element.filter_showChildren.checked;

	// Filter data
	for (var i = 1; i < oTable.rows.length; i++)
	{
		var oRow = oTable.rows[i];
		table_checkRowIsFiltered(oRow, element.textToSearch);
		if (!_table_filtered) _table_filtered = oRow.filtered;
	}

	if (showParents)
		for (var i = 1; i < oTable.rows.length; i++)
		{
			var oRow = oTable.rows[i];
			if (oRow.subRows != null)
			{
				var subrows_filtered = table_isSubRowsFiltered(oRow);
				if (!subrows_filtered && oRow.filtered)
				{
					oRow.style.display = "";
					oRow.mustBeVisible = true;
				}
			}
		}

	if (showChildren)
		for (var i = 1; i < oTable.rows.length; i++)
		{
			var oRow = oTable.rows[i];
			var oParent = oRow.parentRow;
			while (oParent)
			{
				if (oParent && !oParent.filtered)
				{
					oRow.style.display = "";
					oRow.mustBeVisible = true;
					break;
				}
				oParent = oParent.parentRow;
			}
		}

	// Checking tree images & updating textIndent
	for (var i = 0; i < oTable.rows.length; i++)
	{
		var oRow = oTable.rows[i];
		if (!oRow.mustBeVisible) continue;

		if (oRow.subRows != null)
		{
			var subrows_filtered = table_isSubRowsFiltered(oRow);
			if (subrows_filtered)
				hideTreeImage(oRow.m_treeImage);
			else
			{
				if (oRow.filtered) { oRow.opened = true; oRow.m_treeImage.opened = true; }
				showTreeImage(oRow.m_treeImage);
			}
		}

		var _visibleLevels = 0;
		var oParentRow = oRow.parentRow;
		while (oParentRow != null)
		{
			if (oParentRow.mustBeVisible)
			{
				_visibleLevels++;
				if (!oParentRow.opened) oRow.style.display = "none";
			}
			oParentRow = oParentRow.parentRow;
		}
		oRow.childNodes[0].style.paddingLeft = (5 + _visibleLevels * 16) + "px";
	}

	// Checking if active row was filtered
	var aRow = oTable.parentNode.tableElement.m_activeRow;
	if (aRow == null || !aRow.mustBeVisible || aRow.style.display == "none")
	{
		table_setActiveRow(oRow.tableElement, null, true);
		for (var j = 1; j < oTable.rows.length; j++)
		{
			if (!oTable.rows[j].filtered && oTable.rows[j].mustBeVisible)
			{
				table_activateRow(oRow.tableElement, j-1, true);
				break;
			}
		}
	}
	else if (aRow != null)
		table_activateRow(oRow.tableElement, aRow.rowIndex-1, true);

	element.filtered = _table_filtered;
	table_showFilterOptions(element, _table_filtered);
	table_resizeCaptions(element);
	table_checkHeaderWidth(element.rootDiv.tablePane);
	table_updateToolbar(element);
	table_updateDateTimeColumnsForTable(element.rootDiv.tablePane.m_dataTable);
}

function table_updateFilterState(element)
{
	// enabling filter if necessary
	var columns = element.table.columns;
	for (var i = 0; i < columns.length; i++)
	{
		if (columns[i].filterList.length > 1)
		{
			caption_enableFilter(columns[i].m_caption);
		}
	}

	table_updateToolbar(element);
}

function table_CreateToolbar(element)
{
	if (!c_ShowToolbar || !element)
		return;

	element.m_toolbar = document.createElement("DIV");
	element.m_toolbar.style.height = "0px";
	element.rootDiv.appendChild(element.m_toolbar);

	element.m_toolbar.m_search = document.createElement("DIV");
	element.m_toolbar.m_search.style.whiteSpace = "nowrap";
	element.m_toolbar.m_search.style.float = "right";
	element.m_toolbar.m_search.element = element;
	element.m_toolbar.appendChild(element.m_toolbar.m_search);

	element.m_toolbar.m_filter = document.createElement("DIV");
	element.m_toolbar.m_filter.style.overflow = "hidden";
	element.m_toolbar.m_filter.element = element;
	element.m_toolbar.appendChild(element.m_toolbar.m_filter);
}

function table_updateToolbar(element)
{
	if (!c_ShowToolbar || !element || !element.m_toolbar || !element.table.columns || !element.table.columns.length)
		return;

	var filter_visible = (element.table.columns[0].isImage && element.table.columns[0].filterList.length > 1);
	var search_visible = false;
	for (var i = 0; i < element.table.columns.length; i++)
	{
		if (element.table.nestedDataCount > 0 && element.table.columns[i].filterList.length > 1)
			search_visible = true;
	}

	if (filter_visible || search_visible)
	{
		var is_visible = (element.m_toolbar.offsetHeight > 0);

		element.m_toolbar.className = "singleFrame";
		element.m_toolbar.style.width = "100%";
		element.m_toolbar.style.height = c_tableToolbarHeight + "px";
		element.m_toolbar.style.overflow = "hidden";
		element.m_toolbar.style.borderBottom = "0px";
		element.m_toolbar.style.backgroundColor = "#EEEEEE";
		
		var html = "";

		if (filter_visible)
			for (var i = 0; i < element.table.columns[0].filterList.length; i++)
				html += "<td style='white-space: nowrap; padding: 2px;'>&nbsp;" + element.table.columns[0].filterList[i].value +
					" <label><input type='checkbox'" + (element.table.columns[0].filterList[i].checked ? " checked='checked'" : "") + " onchange='table_toolbarFilterChange(this, " + i + ")'>" +
					"<span style='vertical-align: 3px;'>&nbsp;" + (element.table.columns[0].filterList[i].description || "")  + "</span></label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>";

		element.m_toolbar.m_filter.innerHTML = "<table cellpadding=0 cellspacing=2 border=0><tr>" + html + "</tr></table>";
		
		if (search_visible && !element.m_toolbar.searchboxCreated)
		{
			element.m_toolbar.searchboxCreated = true;
			element.m_toolbar.m_search.style.padding = "2px";
			element.m_toolbar.m_search.innerHTML = "&nbsp;&nbsp;<img src='null.gif' class='icon icon-search' style='vertical-align:middle;'>&nbsp;" +
				"<input type='search' style='width:160px; height:22px; box-sizing:border-box;' oninput='table_searchTextChanged(this, false)' onchange='table_searchTextChanged(this, true)' value='" + (element.textToSearch || "").replace("'", "\"") + "'>";
		}
		
		if (element.m_toolbar.m_search.querySelector)
		{
			var searchbox = element.m_toolbar.m_search.querySelector("input[type='search']");
			if (searchbox)
			{
				searchbox.value = element.textToSearch || "";
				searchbox.captureKeys = true;
			}
		}

		if (!is_visible)
		{
			element.rootDiv.tablePane.style.height = (element.rootDiv.tablePane.offsetHeight - element.m_toolbar.offsetHeight) + "px";
			table_UpdateColumnsPosition(element);
		}
	}
}

function table_toolbarFilterChange(checkbox, index)
{
	var toolbar = checkbox;
	while (toolbar && toolbar.tagName.toLowerCase() != "div") toolbar = toolbar.parentNode;
	if (!toolbar) return;
	
	var column = toolbar.element.table.columns[0];
	column.filterList[index].checked = checkbox.checked;
	
	column.filtered = false;
	for (var i = 0; i < column.filterList.length; i++)
		if (!column.filterList[i].checked) { column.filtered = true; break; }

	table_updateFilter(toolbar.element.rootDiv.tablePane.m_dataTable);
}

var searchTimer = null;
function table_searchTextChanged(input, immediately)
{
	var toolbar = input;
	while (toolbar && toolbar.tagName.toLowerCase() != "div") toolbar = toolbar.parentNode;
	if (!toolbar)
		return;

	if (searchTimer)
		clearTimeout(searchTimer);
		
	if (toolbar.element.textToSearch != input.value)
		searchTimer = setTimeout(table_searchText, (immediately || input.value == "") ? 0 : 500, toolbar.element, input.value);
}

function table_searchText(element, text)
{
	element.textToSearch = text;
	table_updateFilter(element.rootDiv.tablePane.m_dataTable);
}

var table_js = true;