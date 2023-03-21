var c_FilesCompare_MaxLineCount = 5000;
var c_FilesCompare_UseMonoFont = true;
var c_FilesCompare_KeepSpaces = true;
var c_FilesCompare_ShowLineNumbers = false;

var c_FilesCompare_MaxLineDiffPercent = 80;
var c_FilesCompare_CheckSiblingLines = 50;

var c_FilesCompare_MaxLineDiffCount = 10;
var c_FilesCompare_ToolbarHeight = 28;

var m_text_files_diffs_progress = 0;
var m_text_files_diff_pos = -1;
var m_text_files_diff_lines = [];
var m_text_files_rootDiv = null;

function text_load(element)
{
	text_clear(element);
	element.innerHTML = "";

	element.schemas = new Array("aqds:text", "aqds:xml");

	element.m_rootdiv = null;

	element.m_rootTable = window.document.createElement("TABLE");
	if (element.detailsHead == null)
		element.m_rootTable.className = "singleFrame";
	element.m_rootTable.cellSpacing = 0;
	element.m_rootTable.cellPadding = 0;
	element.m_rootTable.border = 0;

	element.m_rootTable.style.width = "100%";
	element.m_rootTable.style.height = "100%";

	element.appendChild(element.m_rootTable);
	
	var oBody = window.document.createElement("TBODY");
	element.m_rootTable.appendChild(oBody);
	
	var oTR = window.document.createElement("TR");
	oBody.appendChild(oTR);
	
	element.m_rootTD = window.document.createElement("TD");
	element.m_rootTD.vAlign = "top";
	oTR.appendChild(element.m_rootTD);

	element.doResize = function(_Width, _Height)
	{
		if (_Height < 20) _Height = 20;
	
		if (element.detailsHead == null) { _Width -= 2; _Height -= 2; }
		if (element.location == null) { /*_Width -= 2; _Height -= 2;*/ }
		else { element.m_rootTD.firstChild.height = _Height - 2; }

		if (element.popupDiv != null)
		{
			var left = (getScreenX(element) - 1) + "px";
			element.popupDiv.style.left = left;
			element.popupDiv.style.width = _Width + 2;
			if (element.popupIFrame != null)
			{
				element.popupIFrame.style.left = left;
				element.popupIFrame.style.width = _Width + 2;
			}
		}

		if (this.m_rootdiv)
		{
			this.m_rootdiv.style.width = _Width + "px";
			this.m_rootdiv.style.height = _Height + "px";
		}
		this.m_rootTable.style.width = _Width + "px";
		this.m_rootTable.style.height = _Height + "px";

		if (element.detailsHead == null) { _Width += 2; _Height += 2; }
		this.style.width = _Width + "px";
		this.style.height = _Height + "px";
	}

	var _Width = element.offsetWidth;
	var _Height = element.offsetHeight;

	text_Load(element);

	element.doResize(_Width, _Height);
}

function text_clear(element)
{
	m_text_files_rootDiv = null;
	element.m_rootTD = null;
	if (element.m_rootdiv)
	{
		element.m_rootdiv.compareTable = null;
		element.m_rootdiv.m_toolbar = null;
		if (element.m_rootdiv.file1Div)
			element.m_rootdiv.file1Div.parentDiv = null;
		if (element.m_rootdiv.file2Div)
			element.m_rootdiv.file2Div.parentDiv = null;
		element.m_rootdiv.file1Div = null;
		element.m_rootdiv.file2Div = null;
	}
	element.m_rootdiv = null;
	element.m_rootTable = null;
}

function text_createRootDiv(element)
{
	if (element.m_rootdiv == null)
	{	
		element.m_rootdiv = window.document.createElement("DIV");
		element.m_rootTD.appendChild(element.m_rootdiv);
	}
}

function text_Load(element)
{
	if (element.value == null && (element.src != null || element.location != null) && element.textObject)
	{
		var txt = element.textObject;
		if (txt.name && txt[txt.name])
			element.value = txt[txt.name].text;
	}

	if (element.value != null) 
	{
		text_createRootDiv(element);
		element.m_rootdiv.innerHTML = "";

		var textFormat = 0;
		if (element.textObject != null)
			textFormat = element.textObject.textFormat;

		if (element.isFileName != null && element.isFileName == false)
			textFormat = 0;

		if (textFormat == 0 || textFormat == 3)
		{
			element.m_rootdiv.className = "info_text";
			element.m_rootdiv.innerText = element.value;
		}
		else
		{
			var p = element.location.lastIndexOf("\\");
			if (p < 0) p = element.location.lastIndexOf("/");
			if (p > 0) element.value = element.location.substring(0, p + 1) + element.value;
			var url = element.value;
			if (isOpera) url = url.toLowerCase();
			var loc = isIE ? "probably.mht" : "";
			try { loc = window.document.location.href; } catch (e) { }
			var MHT_XML = (url.indexOf(".xml") == url.length - 4) && (loc.indexOf(".mht") == loc.length - 4);
			if (MHT_XML)
			{
				element.m_rootdiv.style.padding = "5px";
				element.m_rootdiv.style.overflow = "scroll";
				element.m_rootdiv.cellValue = url;
				element.m_rootdiv.topControl = element;
				element.m_rootTD.tableElement = element;
				element.m_rootdiv.location = element.location;
				table_showLinkPopup(element.m_rootdiv, MHT_XML, true);
			}
			else
			{
				element.m_rootdiv.style.padding = "0px";
				element.m_rootdiv.style.overflow = "hidden";
				element.m_rootdiv.innerHTML = "<iframe width='100%' height='100%' frameborder='0' src='" + url + "'/>";
			}
		}
	}
}

function text_createTable(width, height, className, caption, createOneRow, columnCount)
{
	if (!columnCount) columnCount = 1;

	var table = document.createElement("TABLE");
	table.cellSpacing = 0;
	table.cellPadding = 0;
	table.border = 0;
	if (width) table.style.width = width + "px";
	if (height) table.style.height = height + "px";
	if (className) table.className = className;

	if (caption) text_setTableCaption(table, caption, columnCount);

	var oBody = document.createElement("TBODY");
	table.appendChild(oBody);
	
	if (createOneRow)
	{
		var oTR = document.createElement("TR");
		oBody.appendChild(oTR);

		for (var i = 0; i < columnCount; i++)
			oTR.appendChild(document.createElement("TD"));
	}

	return table;
}

function text_setTableCaption(table, caption, colSpan)
{
	var oHead = document.createElement("THEAD");
	table.appendChild(oHead);
	
	var oTR = document.createElement("TR");
	oHead.appendChild(oTR);
	
	var oTD = document.createElement("TD");
	oTD.colSpan = colSpan;
	oTR.appendChild(oTD);

	oTD.className = "cellCaption";
	oTD.innerText = caption;
}

function text_files_compare(element)
{
	element.schemas = new Array("aqds:filescompare");

	element.m_rootTable = text_createTable(element.offsetWidth, element.offsetHeight, "singleFrame", element.filesCompare.caption, true);
	element.appendChild(element.m_rootTable);

	var oTD = element.m_rootTable.tBodies[0].rows[0].cells[0];
	element.m_rootdiv = document.createElement("DIV");
	element.m_rootdiv.style.padding = c_InnerPadding + "px";
	element.m_rootdiv.style.overflow = "hidden";
	element.m_rootdiv.style.width = oTD.offsetWidth + "px";
	element.m_rootdiv.style.height = oTD.offsetHeight + "px";
	oTD.appendChild(element.m_rootdiv);

	element.doResize = function(_Width, _Height)
	{
		_Width = _Width - 2;
		_Height = _Height - 21;

		if (this.m_rootdiv)
		{
			this.m_rootdiv.style.width = _Width + "px";
			this.m_rootdiv.style.height = _Height + "px";
			var innerWidth = (this.m_rootdiv.clientWidth - c_InnerPadding * 2);
			var innerHeight = (_Height - c_InnerPadding * 2);
			if (this.m_rootdiv.compareTable)
			{
				this.m_rootdiv.compareTable.style.width = innerWidth + "px";
				this.m_rootdiv.compareTable.style.height = innerHeight + "px";
			}
			if (this.m_rootdiv.m_toolbar)
			{
				this.m_rootdiv.m_toolbar.style.width = innerWidth + "px";
				innerHeight -= (c_FilesCompare_ToolbarHeight + c_InnerPadding);
			}
			if (this.m_rootdiv.file1Div)
			{
				this.m_rootdiv.file1Div.style.width = (innerWidth / 2) - 9 + "px";
				this.m_rootdiv.file1Div.style.height = (innerHeight - 19) + "px";
			}
			if (this.m_rootdiv.file2Div)
			{
				this.m_rootdiv.file2Div.style.width = (innerWidth / 2) + "px";
				this.m_rootdiv.file2Div.style.height = (innerHeight - 19) + "px";
			}
		}

		this.m_rootTable.style.width = _Width + "px";
		this.m_rootTable.style.height = _Height + "px";

		this.style.width = _Width + "px";
		this.style.height = _Height + "px";
		
		filesCompare_UpdateToolbar();
	}

	var _Width = element.offsetWidth;
	var _Height = element.offsetHeight;

	if (element.filesCompare.files && element.filesCompare.files.length == 2)
	{
		var file1 = element.filesCompare.files[0];
		var file2 = element.filesCompare.files[1];
		var filename1 = file1.filename;
		var filename2 = file2.filename;
		if (filename1 != "" && filename2 != "")
		{
			var text = _load_Text(correctLocation(element.location, filename1));
			if (text === null) // failed to load
			{
			  var error_message = "You are unable to view file comparison result, because your browser settings do not allow reading data from files.";

				var pc = navigator.userAgent.indexOf("Chrome");
				var pe = navigator.userAgent.indexOf("Edge");
				if (pc > 0 && pe < 0)
				{
				  error_message += "<br><br>" +
						"<b>To see the file comparison result, change the browser settings:</b><br>" +
						"1. Open the properties of the Google Chrome shortcut. To do this, right-click the Chrome shortcut on the desktop or in the Windows menu and choose Properties from the context menu.<br>" +
						"2. Add the \" --allow-file-access-from-files\" command-line argument to the end of the Target text box.<br>" +
						"3. Click OK to close the Properties dialog and to save the changes.<br>" +
						"4. Restart Google Chrome and re-open the log file.";
				}

				var color = "#BB0000";
				var deco = "padding:4px; border:1px solid " + color + ";";
				var font = "font-size:12px;";
				
				element.m_rootdiv.innerHTML =
					"<div style='" + font + deco + " background-color:" + color + "; color:white; font-weight:bold;'>File cannot be loaded</div>" +
					"<div style='" + font + deco + " line-height:18px;'>" + error_message + "</div>"
			}
			else
			{
				text_show_files_diffs(element.m_rootdiv,
					correctLocation(element.location, filename1),
					correctLocation(element.location, filename2),
					file1.Name, // + " " + file1.File,
					file2.Name // + " " + file2.File
				);
			}
		}
	}

	element.doResize(_Width, _Height);
}

function text_load_from_file(url)
{
	var text = _load_Text(url);
	if (text === null)
		return "";

	return text.replace(new RegExp("\r\n", "g"), "\n").split("\n");
}

function text_filePanelScroll()
{
	if (!this.parentDiv) return;

	if (this == this.parentDiv.file1Div)
	{
		this.parentDiv.file2Div.scrollLeft = this.parentDiv.file1Div.scrollLeft;
	}
	else
	{
		this.parentDiv.file1Div.scrollTop = this.parentDiv.file2Div.scrollTop;
		this.parentDiv.file1Div.scrollLeft = this.parentDiv.file2Div.scrollLeft;

		m_text_files_diff_pos = Math.round(this.parentDiv.file2Div.scrollTop / this.parentDiv.m_rowHeight);
		filesCompare_UpdateToolbar();
	}
}

function text_createFilePanel(parent, width, height, isLeft)
{
	if (isLeft) parent.style.width = "50%";
	if (isLeft) parent.style.paddingRight = "4px"; else parent.style.paddingLeft = "4px";
	if (isLeft) parent.style.borderRight = "1px solid #999999";
	parent.vAlign = "top";

	var oDiv = document.createElement("DIV");
	oDiv.style.width = (width / 2 - (isLeft ? 9 : 0)) + "px";
	oDiv.style.height = (height - 19) + "px";
	oDiv.style.overflowX = "scroll";
	oDiv.style.overflowY = isLeft ? "hidden" : "scroll";
	oDiv.onscroll = text_filePanelScroll;
	parent.appendChild(oDiv);
	return oDiv;
}

function text_find_line_diffs(line1, line2, isMatch, iteration)
{
	var isMatch = (isMatch || false);
	var iteration = (iteration || 0);

	var line1_length = line1.length;
	var line2_length = line2.length;
	var min_length = Math.min(line1_length, line2_length);

	// Find first and last symbols that differs / matches (depending on isMatch)
	var diff_start = -1;
	var diff_end = -1;
	for (var i = 0; i < min_length; i++)
	{
		if (diff_start < 0 && ((line1.substring(i, i+1) == line2.substring(i, i+1)) == isMatch))
			diff_start = i;

		if (diff_end < 0 && (line1.substring(line1_length - i - 1, line1_length - i) == line2.substring(line2_length - i - 1, line2_length - i)) == isMatch)
			diff_end = i;
			
		if (diff_start >= 0 && diff_end >= 0)
			break;
	}

	if (diff_start > (min_length - diff_end))
	{
		diff_start = -1;
		diff_end = -1;
	}

	if (diff_start == 0 && diff_end < 0)
		diff_end = min_length;
	if (diff_start < 0 && diff_end == 0)
		diff_start = min_length;

	// Get result, go deeper if needed
	var diff1 = "";
	var diff2 = "";
	var diffs = [ [], [] ];
	if (diff_start >= 0 && diff_end >= 0)
	{
		diff1 = line1.substring(diff_start, line1_length - diff_end);
		diff2 = line2.substring(diff_start, line2_length - diff_end);
		if (isMatch ? (diff1 != diff2) : (iteration < c_FilesCompare_MaxLineDiffCount))
		{
			diffs = text_find_line_diffs(diff1, diff2, !isMatch, iteration + 1);
		}
		else
		{
			diffs[0][0] = diff1;
			diffs[1][0] = diff2;
		}
	}
	else if (!isMatch && line1_length != line2_length)
	{
		diff1 = line1;
		diff2 = line2;
		diffs[0][0] = diff1;
		diffs[1][0] = diff2;
	}
	
	var results = [];
	results[0] = diff1.length == 0 ? [line1] : [line1.substring(0, diff_start)].concat(diffs[0]).concat([line1.substring(line1_length - diff_end)]);
	results[1] = diff2.length == 0 ? [line2] : [line2.substring(0, diff_start)].concat(diffs[1]).concat([line2.substring(line2_length - diff_end)]);
	return results;
}

function text_fix_raw_string(str)
{
	var result = str.replace(new RegExp("<", "g"), "&lt;").replace(new RegExp(">", "g"), "&gt;");
	if (c_FilesCompare_KeepSpaces) result = result.replace(new RegExp("\t", "g"), "  ").replace(new RegExp(" ", "g"), "&nbsp;");
	return result;
}

function text_get_diffs_percent(diffs, line1_length, line2_length)
{
	var diff1_length = diffs[0].length;
	var diff2_length = diffs[1].length;

	var diff1 = 0;
	for (var i = 1; i < diff1_length; i += 2)
		diff1 += diffs[0][i].length;

	var diff2 = 0;
	for (var i = 1; i < diff2_length; i += 2)
		diff2 += diffs[1][i].length;

	diff1 = line1_length > 0 ? Math.round(diff1 * 100 / line1_length) : (line2_length == 0 ? 0 : 100);
	diff2 = line2_length > 0 ? Math.round(diff2 * 100 / line2_length) : (line1_length == 0 ? 0 : 100);

	return Math.max(diff1, diff2);
}

function text_find_similar_line(lines1, lines2, line1_index, line2_index, maxLineCount)
{
	var result = null;

	var line_count = Math.min(maxLineCount || c_FilesCompare_CheckSiblingLines, lines1.length - line1_index - 1, lines2.length - line2_index - 1);

	// Check if there are the same lines within next line_count lines

	for (var i = 1; i <= line_count; i++)
	{
		var line1i = lines1[line1_index + i];
		var line2i = lines2[line2_index + i];

		if (line1i.length > 0 && line1i == line2i)
			return null;
		
		for (var j = 0; j < i; j++)
		{
			var line1j = lines1[line1_index + j];
			var line2j = lines2[line2_index + j];

			if (line1i.length > 0 && line1i == line2j)
				return { line1_index: i, line2_index: j, diffs_percent: 0, diffs: [ [line1i], [line2j] ], areEqual: true };
			else if (line2i.length > 0 && line2i == line1j)
				return { line1_index: j, line2_index: i, diffs_percent: 0, diffs: [ [line1j], [line2i] ], areEqual: true };
		}
	}

	// Get minimum difference between next line_count lines

	var line1 = lines1[line1_index];
	var line2 = lines2[line2_index];

	var minDiff = 100;
	var emptyResult = null;
	var hasSkippedMatchingEmptyStrings = false;
	
	function compareLines(_line1, _line2, _line1_index, _line2_index)
	{
		var line1_length = _line1.length;
		var line2_length = _line2.length;
		if (line1_length == 0 && line2_length == 0)
		{
			if (emptyResult == null) emptyResult = { line1_index: _line1_index, line2_index: _line2_index, diffs_percent: 0, diffs: [ [""], [""] ], areEqual: true }
		}
		else
		{
			var diffs = text_find_line_diffs(_line1, _line2);
			var diffs_percent = text_get_diffs_percent(diffs, line1_length, line2_length);
			if (diffs_percent < minDiff)
			{
				result = { line1_index: _line1_index, line2_index: _line2_index, diffs_percent: diffs_percent, diffs: diffs, areEqual: _line1 == _line2 };
				minDiff = diffs_percent;
				if (minDiff == 0)
					return true;
			}
		}
		return false;
	}

	for (var i = 1; i <= line_count; i++)
	{
		var line1i = lines1[line1_index + i];
		var line2i = lines2[line2_index + i];
		
		if (compareLines(line1i, line2, i, 0) || compareLines(line1, line2i, 0, i))
			break;
	}
	
	if (minDiff > 0)
	{
		if (emptyResult)
			return emptyResult;
		if (hasSkippedMatchingEmptyStrings)
			return null;
	}

	return result;
}

function text_show_files_diffs(div, filename1, filename2, caption1, caption2)
{
	m_text_files_diff_pos = -1;
	m_text_files_diff_lines = [];
	m_text_files_rootDiv = div;

	var text1 = text_load_from_file(filename1);
	var text2 = text_load_from_file(filename2);

	var result = document.createDocumentFragment();

	var width = div.offsetWidth - c_InnerPadding * 2;
	var height = div.offsetHeight - c_InnerPadding * 2 - (c_FilesCompare_ToolbarHeight + c_InnerPadding);

	var toolbar = document.createElement("DIV");
	toolbar.className = "singleFrame";
	toolbar.style.width = width + "px";
	toolbar.style.height = c_FilesCompare_ToolbarHeight + "px";
	toolbar.style.overflow = "hidden";
	toolbar.id = "diffs_toolbar";
	toolbar.style.marginBottom = c_InnerPadding + "px";
	div.appendChild(toolbar);
	div.m_toolbar = toolbar;

	var btn_td = "<td style='border:1px solid #ACA899; white-space: nowrap;' onmouseover='filesCompare_btnToggle(this, true)' onmouseout='filesCompare_btnToggle(this, false)' onmousedown='return false' ";
	toolbar.innerHTML = "<table cellpadding=0 cellspacing=2 border=0><tr>" +
		btn_td + "onclick='filesCompare_NextDiff()' ondblclick='filesCompare_NextDiff()' id='filesCompare_btnNext' class='btn_disabled'> <img src='null.gif' class='icon icon-sort-d' style='vertical-align:middle; margin:6px 0px 5px 5px;'> Next Difference &nbsp;&nbsp;</td>" +
		btn_td + "onclick='filesCompare_PrevDiff()' ondblclick='filesCompare_PrevDiff()' id='filesCompare_btnPrev' class='btn_disabled'> <img src='null.gif' class='icon icon-sort-a' style='vertical-align:middle; margin:6px 0px 5px 5px;'> Previous Difference &nbsp;&nbsp;</td>" +
		"</tr></table>";

	var tbl = text_createTable(width, height, null, caption1, true, 2);
	result.appendChild(tbl);
	div.compareTable = tbl;

	var oTR = tbl.tHead.rows[0];
	oTR.cells[0].colSpan = 1;
	var oTD = document.createElement("TD");
	oTD.className = "cellCaption";
	oTD.innerText = caption2;
	oTR.appendChild(oTD);

	div.file1Div = text_createFilePanel(tbl.tBodies[0].rows[0].cells[0], width, height, true);
	div.file1Div.parentDiv = div;

	div.file2Div = text_createFilePanel(tbl.tBodies[0].rows[0].cells[1], width, height, false);
	div.file2Div.parentDiv = div;
	
	function prepare_lines_using_diffs(diffs)
	{
		line1 = (diffs[0].length == 1 ? text_fix_raw_string(diffs[0][0]) : "");
		if (diffs[0].length > 1)
			for (var z = 0; z < diffs[0].length; z++)
				line1 += (diffs[0][z].length == 0 ? "" : "<span style='background-color:" + (z % 2 == 0 ? "#C9E0C9" : "#7EB67E") + "'>" + 
					text_fix_raw_string(diffs[0][z]) + "</span>");

		line2 = (diffs[1].length == 1 ? text_fix_raw_string(diffs[1][0]) : "");
		if (diffs[1].length > 1)
			for (var z = 0; z < diffs[1].length; z++)
				line2 += (diffs[1][z].length == 0 ? "" : "<span style='background-color:" + (z % 2 == 0 ? "#C9E0C9" : "#7EB67E") + "'>" + 
					text_fix_raw_string(diffs[1][z]) + "</span>");
	}

	var col1_width_set = false;
	function append_lines(_line1, _line2, line1_style, line2_style, has_line1, has_line2, _line1_index, _line2_index)
	{
		file1Lines[file1Lines.length] = "<tr>" + (c_FilesCompare_ShowLineNumbers && has_line1 ? "<td" + (col1_width_set ? "" : " width='1%'") + ">" + (_line1_index + 1) + "&nbsp;</td>" : "") +
			"<td style='white-space:nowrap;" + (line1_style != "" ? " background-color:" + line1_style : "") + "'>" + (_line1 || "&nbsp;") + "</td></tr>";
		file2Lines[file2Lines.length] = "<tr>" + (c_FilesCompare_ShowLineNumbers && has_line2 ? "<td" + (col1_width_set ? "" : " width='1%'") + ">" + (_line2_index + 1) + "&nbsp;</td>" : "") +
			"<td style='white-space:nowrap;" + (line2_style != "" ? " background-color:" + line2_style : "") + "'>" + (_line2 || "&nbsp;") + "</td></tr>";
		col1_width_set = true;
	}

	var text1_length = text1.length;
	var text2_length = text2.length;
	var maxTextLines = Math.max(text1_length, text2_length);
	var maxLineCount = Math.min(maxTextLines, c_FilesCompare_MaxLineCount);

	var isTruncated = maxTextLines > c_FilesCompare_MaxLineCount;
	var firstDiffFound = false;
	var firstShownLineIndex = 0;
	var linesBeforeFirstDiff = 2;

	var old_status = window.status;
	window.status = "Processing...";

	var file1Lines = [];
	var file2Lines = [];
	var previousDiffLine = -1;
	for (var i = 0, line1_index = 0, line2_index = 0; ; i++, line1_index++, line2_index++)
	{
		if (line1_index % 100 == 0 || line2_index % 100 == 0)
			text_set_files_diffs_progress(Math.round(Math.min(line1_index, line2_index) * 70 / maxLineCount));
		
		var text1_notEOF = (line1_index < text1_length);
		var text2_notEOF = (line2_index < text2_length);

		if ((!text1_notEOF || line1_index >= maxLineCount) &&
			(!text2_notEOF || line2_index >= maxLineCount))
			break;

		var line1 = text1_notEOF ? text1[line1_index] : "";
		var line2 = text2_notEOF ? text2[line2_index] : "";

		var line1_length = line1.length;
		var line2_length = line2.length;
		var equal = (line1_length == line2_length && line1 == line2 && text1_notEOF && text2_notEOF);

		var line1Style = text2_notEOF ? "" : "#FFC7B9";
		var line2Style = text1_notEOF ? "" : "#B8D8FE";

		if (isTruncated && !firstDiffFound)
		{
			if (equal)
			{
				maxLineCount++;
				continue;
			}
			
			firstDiffFound = true;

			if (i > 0)
			{
				if (linesBeforeFirstDiff < i && i <= 10)
					linesBeforeFirstDiff = i;
				
				if (i > linesBeforeFirstDiff)
				{
					c_FilesCompare_ShowLineNumbers = true;
					firstShownLineIndex = (i - linesBeforeFirstDiff);
					append_lines("...", "...", "", "", false, false);
				}

				for (var j = i - linesBeforeFirstDiff; j < i; j++)
				{
					if (j < 0) continue;

					var l1 = text1[j]; if (l1.length != 0) l1 = text_fix_raw_string(l1);
					var l2 = text2[j]; if (l2.length != 0) l2 = text_fix_raw_string(l2);
					append_lines(l1, l2, "", "", (j < text1_length), (j < text2_length), j, j);
				}
			}
		}
			
		if (!equal)
		{
			if (previousDiffLine == i)
				previousDiffLine++;
			else
			{
				m_text_files_diff_lines[m_text_files_diff_lines.length] = i - firstShownLineIndex;
				previousDiffLine = i + 1;
			}
		}

		if (!equal && text1_notEOF && text2_notEOF)
		{
			line1Style = text1_notEOF ? "#C9E0C9" : "";
			line2Style = text2_notEOF ? "#C9E0C9" : "";

			var diffs = text_find_line_diffs(line1, line2);
			var diffs_percent = text_get_diffs_percent(diffs, line1_length, line2_length);

			var similar_line = text_find_similar_line(text1, text2, line1_index, line2_index);
			if (similar_line && similar_line.diffs_percent < diffs_percent)
			{
				var maxDiffLineCount = Math.max(similar_line.line1_index, similar_line.line2_index);
				i += maxDiffLineCount;

				for (var z = 0; z < maxDiffLineCount; z++)
				{
					var hasText1 = (z < similar_line.line1_index);
					var hasText2 = (z < similar_line.line2_index);

					line1 = (hasText1 ? text1[line1_index] : "");
					line2 = (hasText2 ? text2[line2_index] : "");

					var line1z_style = hasText1 ? (hasText2 ? line1Style : "#FFC7B9") : "";
					var line2z_style = hasText2 ? (hasText1 ? line2Style : "#B8D8FE") : "";
					
					if (hasText1 && hasText2)
					{
						diffs = text_find_line_diffs(line1, line2);
						diffs_percent = text_get_diffs_percent(diffs, line1.length, line2.length);
						if (diffs_percent > c_FilesCompare_MaxLineDiffPercent)
						{
							line1z_style = "#FFC7B9";
							line2z_style = "#B8D8FE";
							diffs[0] = [line1];
							diffs[1] = [line2];
						}
						else if (diffs_percent == 0)
						{
							line1z_style = "";
							line2z_style = "";
						}
						prepare_lines_using_diffs(diffs);
					}
					else
					{
						if (line1.length != 0) line1 = text_fix_raw_string(line1);
						if (line2.length != 0) line2 = text_fix_raw_string(line2);
					}
					
					append_lines(line1, line2, line1z_style, line2z_style, hasText1, hasText2, line1_index, line2_index);

					if (hasText1) line1_index++;
					if (hasText2) line2_index++;
				}
				
				diffs = similar_line.diffs;
				if (similar_line.areEqual)
				{
					line1Style = "";
					line2Style = "";
					line1 = text_fix_raw_string(diffs[0][0]);
					line2 = text_fix_raw_string(diffs[1][0]);
				}
			}
			else if (diffs_percent > c_FilesCompare_MaxLineDiffPercent)
			{
				line1Style = "#FFC7B9";
				line2Style = "#B8D8FE";
				diffs[0] = [line1];
				diffs[1] = [line2];
			}
			
			if (!equal)
				prepare_lines_using_diffs(diffs);
		}
		else
		{
			if (line1.length != 0) line1 = text_fix_raw_string(line1);
			if (line2.length != 0) line2 = text_fix_raw_string(line2);
		}

		append_lines(line1, line2, line1Style, line2Style, text1_notEOF, text2_notEOF, line1_index, line2_index);
	}
	
	if (line1_index >= c_FilesCompare_MaxLineCount && line1_index < text1_length) file1Lines[file1Lines.length] = "<tr><td>....</td></tr>";
	if (line2_index >= c_FilesCompare_MaxLineCount && line2_index < text2_length) file2Lines[file2Lines.length] = "<tr><td>....</td></tr>";
	
	text_set_files_diffs_progress(80);

	div.file1Div.innerHTML = "<table cellpadding=0 cellspacing=0 border=0 width=100%" + (c_FilesCompare_UseMonoFont ? " class='monofont'" : "") + ">" + file1Lines.join("") + "</table>";
	div.file2Div.innerHTML = "<table cellpadding=0 cellspacing=0 border=0 width=100%" + (c_FilesCompare_UseMonoFont ? " class='monofont'" : "") + ">" + file2Lines.join("") + "</table>";

	text_set_files_diffs_progress(85);

	var file1Table = div.file1Div.firstChild;
	var file2Table = div.file2Div.firstChild;

	div.appendChild(result);

	text_set_files_diffs_progress(90);

	var maxWidth = file1Table.offsetWidth;
	if (file2Table.offsetWidth > maxWidth)
		maxWidth = file2Table.offsetWidth;

	div.m_rowHeight = file2Table.rows[0].offsetHeight;

	filesCompare_NextDiff();
	filesCompare_UpdateToolbar();
	
	window.status = old_status;
}

function text_set_files_diffs_progress(value)
{
	m_text_files_diffs_progress = value;
	window.status = "Processing... " + value + "%";
}

function text_clearSelection()
{
	if (document.selection && document.selection.empty)
		document.selection.empty();
	else if (window.getSelection)
		window.getSelection().removeAllRanges();
}

function filesCompare_btnToggle(btn, mouseover)
{
	if (btn.className != "btn_disabled")
		btn.className = mouseover ? "btn_hovered" : "btn_enabled";
}

function filesCompare_UpdateToolbar()
{
	if (m_text_files_diff_lines.length == 0)
		return;

	var canScroll = m_text_files_rootDiv.file2Div.scrollTop < (m_text_files_rootDiv.file2Div.scrollHeight - m_text_files_rootDiv.file2Div.clientHeight);

	var btn = document.getElementById("filesCompare_btnNext");
	var bound = m_text_files_diff_lines[m_text_files_diff_lines.length - 1] - 2;
	if (canScroll && btn.className == "btn_disabled")
		{ if (m_text_files_diff_pos < bound) btn.className = "btn_enabled"; }
	else if (m_text_files_diff_pos >= bound || !canScroll)
		btn.className = "btn_disabled";

	btn = document.getElementById("filesCompare_btnPrev");
	bound = m_text_files_diff_lines[0] - 2;
	if (bound < 0) bound = 0;
	if (btn.className == "btn_disabled")
		{ if (m_text_files_diff_pos > bound) btn.className = "btn_enabled"; }
	else if (m_text_files_diff_pos <= bound)
		btn.className = "btn_disabled";
}

function filesCompare_Navigate(down)
{
	var diffs_length = m_text_files_diff_lines.length;
	for (var i = 0; i < diffs_length; i++)
	{
		var diff_pos = m_text_files_diff_lines[down ? i : diffs_length - 1 - i] - 2;
		if (diff_pos < 0) diff_pos = 0;
		if ((down && diff_pos > m_text_files_diff_pos) || (!down && diff_pos < m_text_files_diff_pos))
		{
			m_text_files_rootDiv.file2Div.scrollTop = m_text_files_rootDiv.m_rowHeight * diff_pos;
			if (m_text_files_diff_pos < 0)
				m_text_files_diff_pos = diff_pos;
			break;
		}
	}
}

function filesCompare_NextDiff()
{
	text_clearSelection();
	filesCompare_Navigate(true);
}

function filesCompare_PrevDiff()
{
	text_clearSelection();
	filesCompare_Navigate(false);
}

var text_js = true;