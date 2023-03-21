var c_MaxFilterWidth = 200;

function caption_setStatic(value)
{
	m_static = value;
	if (element.resizeElement != null)
	{
		element.resizeElement.style.cursor = m_static ? "": "e-resize";
	}
}

function caption_CreateControl(element, m_static)
{
	var oTable = window.document.createElement("TABLE");
	element.appendChild(oTable);
	oTable.cellSpacing = 0;
	oTable.cellPadding = 0;
	//oTable.border = 0;

	oTable.style.width = "100%";
	var oBody = window.document.createElement("TBODY");
	oTable.appendChild(oBody);
	var oTR = window.document.createElement("TR");
	oBody.appendChild(oTR);

	var oTD = window.document.createElement("TD");
	oTD.noWrap = true;
	oTD.className = "tableHeaderCell";
	element.captionElement = oTD;
	oTR.appendChild(oTD);


	// Contents: caption and filter button
	var oTable2 = document.createElement("TABLE");
	oTD.appendChild(oTable2);
	oTable2.cellSpacing = 0;
	oTable2.cellPadding = 0;
	oTable2.style.width = "100%";

	var oBody2 = document.createElement("TBODY");
	oTable2.appendChild(oBody2);

	var oTR2 = document.createElement("TR");
	oBody2.appendChild(oTR2);

	element.m_captionDiv = window.document.createElement("SPAN");
	if (element.column != null)
		element.m_captionDiv.innerHTML = element.column.caption
	else
		element.m_captionDiv.innerHTML = "&nbsp;";
	
	var oTD2 = document.createElement("TD");
	oTR2.appendChild(oTD2);
	oTD2.noWrap = true;
	oTD2.style.paddingLeft = "8px";
	oTD2.ownerCell = element;
	oTD2.onclick = caption_click;
	oTD2.onmousedown = caption_mousedown;
	oTD2.appendChild(element.m_captionDiv);

	var oImg = document.createElement("IMG");
	oImg.ownerCell = element;
	oImg.src = "null.gif";
	oImg.width = 10;
	oImg.height = 9;
	element.sortImage = oImg;

	oTD2 = window.document.createElement("TD");
	oTR2.appendChild(oTD2);
	oTD2.style.width = "12px";
	oTD2.vAlign = "middle";
	oTD2.style.paddingTop = "2px";
	oTD2.ownerCell = element;
	oTD2.onclick = caption_click;
	oTD2.onmousedown = caption_mousedown;
	oTD2.appendChild(oImg);

	var filterEnabled = element.column.filterList.length > 1;
	var oImg = document.createElement("IMG");
	oImg.ownerCell = element;
	oImg.src = "null.gif";
	oImg.className = "icon icon-filter0";
	oImg.width = 13;
	oImg.height = 13;
	oImg.clicked = false;
	element.filterImage = oImg;

	if (filterEnabled)
		caption_enableFilter(element);
	else
		oImg.style.cursor = "default";

	oTD2 = window.document.createElement("TD");
	oTR2.appendChild(oTD2);
	oTD2.style.width = "15px";
	oTD2.vAlign = "middle";
	oTD2.style.cursor = "default";
	oTD2.style.lineHeight = "normal";
	oTD2.style.paddingTop = "2px";
	oTD2.appendChild(oImg);

	// Resize cell
	oTD = window.document.createElement("TD");
	oTD.style.width = "2px";
	oTD.style.cursor = m_static ? "": "e-resize";

	oTD.m_captured = false;
	oTD.onmousedown = caption_startDrag;
	oTD.onmouseup = caption_endDrag;
	oTD.onmousemove = caption_mouseMove;

	oTD.ownerCell = element;
	oTD.noWrap = true;
	element.resizeElement = oTD;
	oTR.appendChild(oTD);
	
	element.m_static = m_static;

	element.m_minWidth = Math.max(element.captionElement.offsetWidth + 2, element.m_captionDiv.offsetWidth + 40);
	caption_doResize(element, element.m_minWidth);
}

function caption_clear(element)
{
	if (element.filterImage)
	{
		element.filterImage.ownerCell = null;
		element.filterImage.onmouseover = null;
		element.filterImage.onmouseout = null;
	}
	if (element.m_captionDiv && element.m_captionDiv.parentNode) element.m_captionDiv.parentNode.ownerCell = null;
	if (element.resizeElement) element.resizeElement.ownerCell = null;

	element.captionElement = null;
	element.m_captionDiv = null;
	element.filterImage = null;
	element.resizeElement = null;
	element.realTD = null;
}

function caption_enableFilter(element)
{
	if (element.filterImage.className.indexOf("filter0") < 0 || element.filterImage.clicked == true) return;

	element.filterImage.className = "icon icon-filter";
	element.filterImage.onclick = caption_filterClick;
	element.filterImage.onmouseover = function() { this.className = "icon icon-filter1"; };
	element.filterImage.onmouseout = function() { if (!this.clicked) this.className = "icon icon-filter"; };
	element.filterImage.style.cursor = m_PointerCursor;
}

function caption_startDrag(e)
{
	var element = this.ownerCell;
	if (!element) return;

	if (element.m_static == false)
	{
		if (custom_capture && this._capture != null) { this.releaseCapture(); this.m_captured = false; }

		if (!e) e = window.event;
		if (e.button != 0) return;
		this.setCapture();
		this.m_captured = true;
		this.beginDrag = e.screenX;
		element.init_width = element.offsetWidth;
	}
	if (typeof e.preventDefault == "function")
		e.preventDefault();
}

function caption_mouseMove(e)
{
	if (!this.m_captured) return;

	var element = this.ownerCell;
	if (!element) return;

	if (element.m_static == false)
	{
		if (!e) e = window.event;
		var delta = e.screenX - this.beginDrag;
		if (element.init_width + delta < element.m_minWidth) delta = element.m_minWidth - element.init_width;
		element.style.width = (element.init_width + delta) + "px";
		element.style.minWidth = (element.init_width + delta) + "px";
	}
}

function caption_endDrag(e)
{
	var element = this.ownerCell;
	if (!element) return;

	if (element.m_static == false)
	{
		if (custom_capture && this._capture == null) return;

		if (!e) e = window.event;
		this.releaseCapture();
		this.m_captured = false;
		caption_doResize(element, element.offsetWidth);
	}
}

function caption_doResize(obj, width)
{
	width = Math.round(Math.max(obj.m_minWidth, width));

	obj.realTD.style.width = width + "px";
	obj.realTD.style.minWidth = width + "px";
	obj.realTD.style.height = obj.offsetHeight + "px";

	if (obj.realTD.m_dataTable.creating)
	{
		obj.realTD.m_dataTable.totalWidth += width;
		if (obj.realTD.offsetWidth != width)
			obj.realTD.m_dataTable.mozilla = true;
	}

	width = Math.max(width, obj.realTD.offsetWidth);
	obj.style.width = width + "px";
	obj.style.minWidth = width + "px";
}

function caption_createFilterButton(element, oTable, text, image, posX, posY, btnWidth, btnHeight, onClickHandler)
{
	var oBtn = document.createElement("INPUT");
	if (image != "")
	{
		oBtn.type = "image";
		oBtn.src = "null.gif";
		oBtn.className = "icon icon-" + image;
		oBtn.alt = text;
	}
	else
	{
		oBtn.type = "button";
		oBtn.value = text;
	}
	oBtn.onclick = onClickHandler;
	oBtn.m_caption = element;
	oBtn.m_table = oTable;
	oBtn.onmouseover = function() { this.style.backgroundColor = "#C0D0F0"; };
	oBtn.onmouseout = function() { this.style.backgroundColor = "#EEEEEE"; };

	oBtn.style.borderWidth = "1px";
	oBtn.style.borderStyle = "solid";
	oBtn.style.borderColor = "#333333";
	oBtn.style.backgroundColor = "#EEEEEE";
	oBtn.style.fontSize = "10px";
	oBtn.style.cursor = m_PointerCursor;

	oBtn.style.height = (btnHeight - 4) + "px";
	oBtn.style.width = btnWidth + "px";
	oBtn.style.position = "relative";
	oBtn.style.left = posX + "px";
	if (!isOpera) posY -= 2;
	if (image == "") { if (isOpera) posY += 1; else posY -= 1; }
	oBtn.style.top = posY + "px";
	return oBtn;
}

function caption_hideFilter(filteredColumn, element)
{
	if (filteredColumn == null)
		return true;

	var _tablePane = filteredColumn.realTD.m_dataTable.parentNode;
	if (_tablePane.m_filterDiv != null)
	{
		for (var i = 1; i < _tablePane.m_filterDiv.childNodes.length; i++)
		{
			var item = _tablePane.m_filterDiv.childNodes[i];
			item.m_caption = null;
			item.m_table = null;
			item.onmouseover = null;
			item.onmouseout = null;
			item.onclick = null;
		}

		_tablePane.removeChild(_tablePane.m_filterDiv);
		_tablePane.m_filterDiv = null;

		m_providercell.m_filteredColumn = null;

		filteredColumn.filterImage.clicked = false;
		filteredColumn.filterImage.className = "icon icon-filter";

		if (filteredColumn == element) return false;
	}
	return true;
}

function caption_showFilter(element)
{
	if (caption_hideFilter(m_providercell.m_filteredColumn, element) == false) return;

	var _tablePane = element.realTD.m_dataTable.parentNode;

	var _count = element.column.filterList.length;
	if (_count < 2) return;

	var _padding = 4; var _btnHeight = 25;  var _lineHeight = 19;

	var oDiv = document.createElement("DIV");
	_tablePane.appendChild(oDiv);
	_tablePane.m_filterDiv = oDiv;

	oDiv.captionElement = element;

	var _width = element.offsetWidth - 2;
		if (_width < 100) _width = 100; if (_width > c_MaxFilterWidth) _width = c_MaxFilterWidth;
	var _height = _count * _lineHeight + _btnHeight + 2 * _padding;
		if(_height > (_tablePane.clientHeight - 22)) _height = _tablePane.clientHeight - 22;

	oDiv.style.width = _width + "px";
	oDiv.style.height = _height + "px";

	oDiv.style.borderWidth = "1px";
	oDiv.style.borderColor = "#888888";
	oDiv.style.borderStyle = "solid";
	oDiv.style.padding = (_padding - 1) + "px";
	oDiv.style.backgroundColor = "#EEEEEE";
	oDiv.style.zIndex = 50;

	var _left = 0; var _top = 0;
	oDiv.style.position = "absolute";
	{
		_left = getScreenX(element);
		_top = getScreenY(element) + element.offsetHeight - 1;

		if (element.getBoundingClientRect) _left += _tablePane.scrollLeft;

		oDiv.m_initWidth = _width;
		oDiv.m_initHeight = _height;
		oDiv.style.top = _top + "px";
	}
	if (element.offsetWidth > _width) _left += element.offsetWidth - _width - 2;
	oDiv.m_initLeft = _left;
	oDiv.m_initTop = _top;
	caption_setFilterPosition(oDiv, _tablePane);

	var oTableDiv = document.createElement("DIV");
	oTableDiv.style.width = (_width - (2 * _padding)) + "px";
	oTableDiv.style.height = (_height - (_btnHeight + (2 * _padding)) + 2) + "px";
	oTableDiv.style.overflow = "auto";
	oTableDiv.style.borderBottomStyle = "solid";
	oTableDiv.style.borderBottomWidth = "1px";
	oTableDiv.style.borderBottomColor = "#888888";
	oTableDiv.style.borderCollapse = "collapse";
	oDiv.appendChild(oTableDiv);

	var oTable = document.createElement("TABLE");
	oTableDiv.appendChild(oTable);
	oTable.cellPadding = 0;
	oTable.cellSpacing = 0;
	oTable.style.paddingRight = "2px";

	var oBody = document.createElement("TBODY");
	oTable.appendChild(oBody);

	var recalc_height = false;
	for (var i = 0; i < _count; i++)
	{
		var value = element.column.filterList[i].value;
		var oTR = document.createElement("TR");
		oBody.appendChild(oTR);

		var oTD = document.createElement("TD");
		oTR.appendChild(oTD);
		var oCB = document.createElement("INPUT");
		oCB.type = "checkbox";
		oCB.value = "cb_" + i;
		if (isOpera)
		{
			oCB.style.height = _lineHeight + "px";
			oCB.style.width = _lineHeight + "px";
		}
		oCB.checked = element.column.filterList[i].checked;
		oCB.defaultChecked = element.column.filterList[i].checked;
		oTD.appendChild(oCB);

		oTD = document.createElement("TD");
		if (element.column.typeName == "aqds:image" || value == "&lt;Empty&gt;")
			oTD.innerHTML = value;
		else
			oTD.innerText = value.replace(/[\n\r\f\t\v]/g, " ");
		oTD.noWrap = true;
		oTD.height = _lineHeight;

		oTR.appendChild(oTD);
		
		if (i == 0 && _lineHeight != oTR.offsetHeight)
		{
			recalc_height = true;
			_lineHeight = oTR.offsetHeight;
			oTD.height = _lineHeight;
		}
	}

	if (recalc_height)
	{
		_height = _count * _lineHeight + _btnHeight + 2 * _padding;
		if(_height > (_tablePane.clientHeight - 22)) _height = _tablePane.clientHeight - 22;
		oDiv.style.height = _height + "px";
		oDiv.m_initHeight = _height;
		oTableDiv.style.height = (_height - (_btnHeight + (2 * _padding)) + 2) + "px";
	}

	var oBtn = caption_createFilterButton(element, oTable, "Select All", "select", 0, 4, 19, _btnHeight - 2, caption_SelectAll);
	oDiv.appendChild(oBtn);

	oBtn = caption_createFilterButton(element, oTable, "Unselect All", "unselect", 5, 4, 19, _btnHeight - 2, caption_UnselectAll);
	oDiv.appendChild(oBtn);

	var posY = -2; if (isOpera) posY = -4;
	oBtn = caption_createFilterButton(element, oTable, "Apply", "", 10, posY, 40, _btnHeight, caption_applyFilter);
	oBtn.style.left = (_width - parseInt(oBtn.style.width) - 42 - (2 * _padding)) + "px";
	oDiv.appendChild(oBtn);

	m_providercell.m_filteredColumn = element;

	element.filterImage.className = "icon icon-filter1";

	// checking for possibilily of size enhancement if content is scrollable
	var _maxVisibleWidth = c_MaxFilterWidth - 2 * _padding;
	_width = oTable.offsetWidth + 2;
	if (_width > oTableDiv.clientWidth)
	{
		if (_width > _maxVisibleWidth)
		{
			_width = _maxVisibleWidth;
			_height = parseInt(oDiv.style.height) + _lineHeight;

			if(_height <= (_tablePane.clientHeight - 22))
			{
				oTableDiv.style.height = parseInt(oTableDiv.style.height) + _lineHeight + "px";
				oDiv.style.height = _height + "px";
				oDiv.m_initHeight = _height;
			}
		}

		if (_width <= _maxVisibleWidth)
		{
			//if (element.realTD.m_dataTable.mozilla)
				oTableDiv.style.overflow = ""; 

			oDiv.style.width = (parseInt(oDiv.style.width) + (_width - oTableDiv.offsetWidth)) + "px";
			oTableDiv.style.width = (oDiv.offsetWidth - 2 * _padding) + "px";
			oBtn.style.left = (_width - parseInt(oBtn.style.width) - 42) + "px";
			oDiv.m_initWidth = oDiv.offsetWidth;

			//if (element.realTD.m_dataTable.mozilla)
				oTableDiv.style.overflow = "auto"; 
		}

		if((oTableDiv.offsetHeight - oTableDiv.clientHeight) > 15 && oTable.offsetWidth < _maxVisibleWidth)
		{
			var delta = Math.min(oTableDiv.offsetHeight - oTableDiv.clientHeight, _maxVisibleWidth - oTable.offsetWidth);
			oDiv.style.width = (oDiv.offsetWidth + delta) + "px";
			oTableDiv.style.width = (oTable.offsetWidth + delta) + "px";
			oBtn.style.left = (oDiv.offsetWidth - oBtn.offsetWidth - 42 - (2 * _padding)) + "px";
		}
	}

	table_OperaForceRedraw(_tablePane.tableElement, true);
}

function caption_setFilterPosition(filterDiv, tablePane)
{
	if (isOpera)
	{
		filterDiv.style.left = filterDiv.m_initLeft + "px";
		filterDiv.style.top = filterDiv.m_initTop + tablePane.scrollTop + "px";
	}
	else
	{
		var _left = filterDiv.m_initLeft;
		_left -= tablePane.scrollLeft;
		var _right = _left + filterDiv.m_initWidth;
		filterDiv.style.left = _left + "px";

		var _x = getScreenX(tablePane); var _x2 = _x + tablePane.clientWidth;

		if ( (_right < _x) || (_left > _x2) )
		{
			filterDiv.style.display = "none";
			filterDiv.style.clip = "";
		}
		else if ( (_left < _x) || (_right > _x2) )
		{
			filterDiv.style.display = "";
			filterDiv.style.clip = "rect(0, " + eval(_x2 - _left + 1) + ", " + 
			    filterDiv.m_initHeight + ", " + eval(_x - _left + 1) + ")";
		}
		else
		{
			filterDiv.style.display = "";
			filterDiv.style.clip = "";
		}
	}
}

function caption_SelectAll()
{
	var oColumn = this.m_caption.column;
	var cbs = this.m_table.getElementsByTagName("INPUT");
	for (var i = 0; i < cbs.length; i++)
		cbs[i].checked = true;
}

function caption_UnselectAll()
{
	var oColumn = this.m_caption.column;
	var cbs = this.m_table.getElementsByTagName("INPUT");
	for (var i = 0; i < cbs.length; i++)
		cbs[i].checked = false;
}

function caption_applyFilter()
{
	var oColumn = this.m_caption.column;
	var cbs = this.m_table.getElementsByTagName("INPUT");
	var _checkedCount = 0;
	for (var i = 0; i < cbs.length; i++)
	{
		var id = cbs[i].value.substring(3);
		oColumn.filterList[id].checked = cbs[i].checked;
		if (cbs[i].checked) _checkedCount++;
	}
	oColumn.filtered = (_checkedCount != cbs.length);

	this.m_caption.m_captionDiv.style.fontWeight = oColumn.filtered ? "bold" : "";

	var _tablePane = this.m_caption.realTD.m_dataTable.parentNode;
	caption_hideFilter(this.m_caption);

	table_updateFilter(_tablePane.m_dataTable);
}

function caption_filterClick()
{
	this.clicked = true;
	caption_showFilter(this.ownerCell);
}

function caption_setSortDirection(tableCell, ascending, visible)
{
	var img = tableCell.ownerCell.sortImage;
	if (visible)
	{
		if (ascending) img.className = "icon icon-sort-a";
		else img.className = "icon icon-sort-d";
	}
	else
		img.className = "";
}

var m_preventClick = false;

function caption_click(e)
{
	if (m_preventClick)
		return;

	var columnId = this.ownerCell.realTD.cellIndex;
	var table = this.ownerCell.realTD.m_dataTable;

	if (table.m_sortCaption)
		caption_setSortDirection(table.m_sortCaption, false, false);

	table.m_sortAscending = table.m_sortColumnId != columnId || !table.m_sortAscending;
	table.m_sortColumnId = columnId;
	table.m_sortCaption = this;

	table_sort(table);

	caption_setSortDirection(this, table.m_sortAscending, true);

	table_OperaForceRedraw(table.parentNode.tableElement, false);
}

function caption_mousedown(e)
{
	m_preventClick = false;
	e = e || window.event;
	var is_middle = (e.which == null) ? (e.button == 4) : (e.which == 2);
	if (is_middle && this.ownerCell.realTD.column.isDateTime)
	{
		m_preventClick = true;
		if (e.preventDefault) e.preventDefault();
		if (e.cancelBubble !== undefined) e.cancelBubble = true;
		
		c_ShowTimeDifference = !c_ShowTimeDifference;
		var table = this.ownerCell.realTD.m_dataTable;
		table_updateDateTimeColumnsForTable(table);
	}
}

var caption_js = true;