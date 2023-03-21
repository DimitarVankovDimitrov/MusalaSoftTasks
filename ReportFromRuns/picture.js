var global_picture_id = 0;

function picture_load(element)
{
	element.schemas = new Array("aqds:image", "aqds:picture");

	if (element.m_rootdiv == null)
	{
		
		var oTable = window.document.createElement("TABLE");
		element.appendChild(oTable);

		if (element.detailsHead == null)
			oTable.className = "singleFrame";
		oTable.cellSpacing = 0;
		oTable.cellPadding = 0;
		oTable.border = 0;

		element.m_rootTable = oTable;

		oTable.style.width = "100%";
		oTable.style.height = "100%";
//		oTable.height = element.parentNode.offsetHeight - c_InnerPadding * 2 - 2;
		
		var oBody = window.document.createElement("TBODY");
		oTable.appendChild(oBody);
		
		var oTR = window.document.createElement("TR");
		oBody.appendChild(oTR);
		
		var oTD = window.document.createElement("TD");
		oTD.vAlign = "top";
		oTR.appendChild(oTD);
		
		element.m_rootdiv = window.document.createElement("DIV");
		element.m_rootdiv.style.padding = "3px";
		element.m_rootdiv.style.overflow = "auto";

		oTD.appendChild(element.m_rootdiv);
	}

	element.doResize = function(_Width, _Height)
	{
		if (this.m_rootdiv)
		{
			this.m_rootdiv.style.width = (_Width - (element.m_pics ? 0 : 2)) + "px";
			this.m_rootdiv.style.height = (_Height - (element.m_pics ? 0 : 2)) + "px";

			if (element.m_pics)
			{
				var picCount = element.m_pics.length;
				if (picCount > 2) picCount = 2;
				for (var i = 0; i < picCount; i++)
				{
					var pic = document.getElementById("pictureDiv_" + element.m_pics[i]);
					if (pic) { pic.style.width = Math.round((_Width - 21) / picCount) + "px"; pic.style.height = (_Height - 30) + "px"; }
				}
			}
		}

		this.m_rootTable.style.width = _Width + "px";
		this.m_rootTable.style.height = _Height + "px";

		this.style.width = _Width + "px";
		this.style.height = _Height + "px";
	}

	element.doResize(element.offsetWidth, element.offsetHeight);

	element.m_rootdiv.innerHTML = "";

	if (element.src != null)
	{
			element.m_rootdiv.innerHTML = "";

			var oSpan = window.document.createElement("SPAN");
			element.m_rootdiv.appendChild(oSpan);
			// TODO
	}
	else if (element.value != null) 
	{
		element.m_rootdiv.innerHTML = "";

		var oSpan = window.document.createElement("SPAN");
	     	oSpan.innerHTML = "<img src=\"" + element.value + "\" border=\"0\">";
		element.m_rootdiv.appendChild(oSpan);
	}
	else if (element.table != null && element.pictures) // >1 pictures
	{
		var pics = element.pictures;
		if (pics.length != 2 && pics.length != 3) return;

		var _Width = element.offsetWidth;
		var _Height = element.offsetHeight;

		element.m_rootTable.style.border = "0px";
		element.m_rootdiv.style.padding = "0px";
		element.m_rootdiv.style.width = _Width + "px";
		element.m_rootdiv.style.height = _Height + "px";
		element.m_rootdiv.style.overflow = "hidden";
		element.m_rootdiv.innerHTML = "<table cellpadding=0 cellspacing = 0 border=0>" +
			"<tr><td class='singleFrame'></td><td width='5px'>&nbsp;</td><td class='singleFrame'></td></tr></table>";

		element.m_pics = new Array();
		for (var i = 0; i < 2; i++)
		{
			element.m_pics[i] = (global_picture_id++);

			var td = element.m_rootdiv.childNodes[0].rows[0].cells[i * 2];
			td.onmousemove = picture_mousemove;
			td.onmousedown = picture_mousedown;
			td.onmouseup = picture_mouseup;
			td._element = element;
			td.innerHTML = "";
			td.ondblclick = picture_dblclick;

			var pic_caption_row = "<tr><td id='picHeadDiv_" + element.m_pics[i] + "'>" + pics[i].Name + "</td></tr>";
			var tabs = new TabsObject("picHeadDiv_" + element.m_pics[i]);

			var pic_image = "";
			for (var j = i; j < (i > 0 ? pics.length : 1); j++)
			{
				if (j != i) element.m_pics[j] = (global_picture_id++);
				pic_image += "<img style='cursor:pointer;" + (j > 1 ? " display:none;" : "") + "' border='0' ";
				pic_image += "id='pictureImg_" + element.m_pics[j] + "' ";
				pic_image += "src='" + correctLocation(element.location, pics[j].filename) + "'>";
				var tab_caption = pics[j].Name;
				if (tab_caption == null || tab_caption.length == 0)
					tab_caption = "Comparison Mode";
				tabs.addItem(tab_caption, "pictureImg_" + element.m_pics[j]);
			}

			td.innerHTML = "<table cellspacing=0 cellpadding=0 border=0>" + pic_caption_row +
				"<tr><td style='padding:3px;'><div id='pictureDiv_" + element.m_pics[i] + "' " +
				"style='overflow:auto; width:" + Math.round((_Width - 21) / 2) + "px; height:" + (_Height - 30) + "px;'>" + pic_image +
				"</div></td></tr></table>";

			tabs.render();
		}
	}
	
	if (oSpan)
	{
		oSpan.style.cursor = "pointer";
		oSpan.onmousemove = picture_mousemove;
		oSpan.onmousedown = picture_mousedown;
		oSpan.onmouseup = picture_mouseup;
		oSpan.ondblclick = picture_dblclick;
	}
	
}

function picture_move(pic, dx, dy)
{
	if (!pic) return;

	var maxX = pic.scrollWidth  - pic.clientWidth;
	var maxY = pic.scrollHeight - pic.clientHeight;
	if (maxX <= 0 && maxY <= 0) return;

	var x = pic.scrollLeft + dx;
	var y = pic.scrollTop + dy;

	if (x > maxX) x = maxX; if (x < 0) x = 0;
	if (y > maxY) y = maxY; if (y < 0) y = 0;

	if (pic.scrollLeft != x) pic.scrollLeft = x;
	if (pic.scrollTop != y) pic.scrollTop = y;
}

function picture_mousemove(e)
{
	if (!this._movingImage) return;
	if (!e) e = window.event;

	var dx = (this._movedFromX - e.clientX);
	var dy = (this._movedFromY - e.clientY);

	this._movedFromX = e.clientX;
	this._movedFromY = e.clientY;

	var target = this._movingImage.parentNode;
	if (!this._element)
		target = target.parentNode;

	var prevX = target.scrollLeft;
	var prevY = target.scrollTop;

	picture_move(target, dx, dy);

	dx = target.scrollLeft - prevX;
	dy = target.scrollTop - prevY;
	if (dx == 0 && dy == 0) return;

	if (this._element && this._element.m_pics) for (var i = 0; i < this._element.m_pics.length; i++)
	{
		if (i > 1) break;
		var id = "pictureDiv_" + this._element.m_pics[i];
		if (id == target.id) continue;
		var pic = document.getElementById(id);
		var x = dx + (prevX - pic.scrollLeft);
		var y = dy + (prevY - pic.scrollTop);
		picture_move(pic, x, y);
	}
}

function picture_mousedown(e)
{
	if (!e) e = window.event;
	var target = e.target || e.srcElement;
	if (target.nodeName != "IMG") return;

	this._movingImage = target;
	this._movedFromX = e.clientX;
	this._movedFromY = e.clientY;
	this.setCapture();

	if (e.preventDefault) e.preventDefault();
}

function picture_mouseup(e)
{
	if (!e) e = window.event;
	this._movingImage = null;
	this.releaseCapture();
}

function picture_dblclick(e)
{
	if (!e) e = window.event;
	var target = e.target || e.srcElement;
	if (target.nodeName != "IMG") return;
	
	table_doShowLink(false, null, target.src);
}

var picture_js = true;