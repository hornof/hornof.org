var nav_QuickSiteMain = new Object();

nav_QuickSiteMain.accentColor="Black";
nav_QuickSiteMain.accentStyle="Square";
nav_QuickSiteMain.accentType="none";
nav_QuickSiteMain.background="";
nav_QuickSiteMain.basicButton="Gray";
nav_QuickSiteMain.basicTab="White";
nav_QuickSiteMain.bold="true";
nav_QuickSiteMain.border="";
nav_QuickSiteMain.brightButton="Chicky";
nav_QuickSiteMain.buttonCategory="basic";
nav_QuickSiteMain.darkButton="Basic_Black";
nav_QuickSiteMain.dirty="false";
nav_QuickSiteMain.funButton="Arts_and_Crafts";
nav_QuickSiteMain.graphicMouseover="false";
nav_QuickSiteMain.graphicSelected="false";
nav_QuickSiteMain.hasLinks="true";
nav_QuickSiteMain.height="171";
nav_QuickSiteMain.holidayButton="Christmas_Ornaments";
nav_QuickSiteMain.horizontalSpacing="10";
nav_QuickSiteMain.horizontalWrap="6";
nav_QuickSiteMain.imageHeight="31";
nav_QuickSiteMain.imageWidth="114";
nav_QuickSiteMain.importedImage="";
nav_QuickSiteMain.importedImageMouseOver="";
nav_QuickSiteMain.importedImageSelected="";
nav_QuickSiteMain.italic="false";
nav_QuickSiteMain.justification="right";
nav_QuickSiteMain.lineColor="#000000";
nav_QuickSiteMain.lineWidth="2";
nav_QuickSiteMain.localPreview="false";
nav_QuickSiteMain.modernButton="Basic_Black";
nav_QuickSiteMain.mouseoverBgcolor="";
nav_QuickSiteMain.mouseoverBold="true";
nav_QuickSiteMain.mouseoverEffect="true";
nav_QuickSiteMain.mouseoverItalic="false";
nav_QuickSiteMain.mouseoverTextcolor="#5f4330";
nav_QuickSiteMain.mouseoverUnderline="false";
nav_QuickSiteMain.navID="nav_QuickSiteMain";
nav_QuickSiteMain.numLinks="3";
nav_QuickSiteMain.orientation="vertical";
nav_QuickSiteMain.selectedBgcolor="";
nav_QuickSiteMain.selectedBold="true";
nav_QuickSiteMain.selectedEffect="true";
nav_QuickSiteMain.selectedItalic="false";
nav_QuickSiteMain.selectedTextcolor="#5f4330";
nav_QuickSiteMain.selectedUnderline="false";
nav_QuickSiteMain.shinyButton="Shiny_Aqua";
nav_QuickSiteMain.simpleButton="Autumn_Leaves";
nav_QuickSiteMain.sophisticatedButton="Antique";
nav_QuickSiteMain.squareTab="Camel";
nav_QuickSiteMain.style="text";
nav_QuickSiteMain.tabCategory="basic";
nav_QuickSiteMain.textColor="#ffffff";
nav_QuickSiteMain.textFont="Arial";
nav_QuickSiteMain.textSize="14";
nav_QuickSiteMain.texturedButton="Brick";
nav_QuickSiteMain.type="Navigation";
nav_QuickSiteMain.underline="false";
nav_QuickSiteMain.version="5";
nav_QuickSiteMain.verticalSpacing="36";
nav_QuickSiteMain.width="100";

nav_QuickSiteMain.navName = "QuickSiteMain";
nav_QuickSiteMain.imagePath = "null";
nav_QuickSiteMain.selectedImagePath = "/~media/elements/LayoutClipart/";
nav_QuickSiteMain.mouseOverImagePath = "/~media/elements/LayoutClipart/";
nav_QuickSiteMain.imageWidth = "16";
nav_QuickSiteMain.imageHeight = "16";
nav_QuickSiteMain.fontClass = "size14 Arial14";
nav_QuickSiteMain.fontFace = "Arial, Helvetica, sans-serif";


var baseHref = '';
// this will only work if getElementsByTagName works
if (document.getElementsByTagName)
{
    // this will only work if we can find a base tag
    var base = document.getElementsByTagName('base');
    // Verify that the base object exists
    if (base && base.length > 0)
    {
        // if you don't specify a base href, href comes back as undefined
        if (base[0].href != undefined)
        {
            // get the base href
            baseHref = base[0].href;
            // add a trailing slash if base href doesn't already have one
            if (baseHref != '' && baseHref.charAt(baseHref.length - 1) != '/')
            {
                baseHref += '/';
            }
        }
    }
}


nav_QuickSiteMain.links=new Array(3);
var nav_QuickSiteMain_Link1 = new Object();
nav_QuickSiteMain_Link1.type = "existing";
nav_QuickSiteMain_Link1.displayName = "Home";
nav_QuickSiteMain_Link1.linkWindow = "_self";
nav_QuickSiteMain_Link1.linkValue = "index.html";
nav_QuickSiteMain_Link1.linkIndex = "1";
nav_QuickSiteMain.links[0] = nav_QuickSiteMain_Link1;
var nav_QuickSiteMain_Link2 = new Object();
nav_QuickSiteMain_Link2.type = "existing";
nav_QuickSiteMain_Link2.displayName = "Technology";
nav_QuickSiteMain_Link2.linkWindow = "_self";
nav_QuickSiteMain_Link2.linkValue = "Technology.html";
nav_QuickSiteMain_Link2.linkIndex = "2";
nav_QuickSiteMain.links[1] = nav_QuickSiteMain_Link2;
var nav_QuickSiteMain_Link3 = new Object();
nav_QuickSiteMain_Link3.type = "existing";
nav_QuickSiteMain_Link3.displayName = "Music";
nav_QuickSiteMain_Link3.linkWindow = "_self";
nav_QuickSiteMain_Link3.linkValue = "Music.html";
nav_QuickSiteMain_Link3.linkIndex = "3";
nav_QuickSiteMain.links[2] = nav_QuickSiteMain_Link3;
function backgroundMouseOn(tdElement, newColor)
{
	if(tdElement != null) {
		tdElement.oldBGColor = tdElement.style.backgroundColor;
		tdElement.style.backgroundColor = newColor;
	}
}
function backgroundMouseOff(tdElement)
{
	if(tdElement != null) {
		tdElement.style.backgroundColor = tdElement.oldBGColor;
	}
} 

function doMouseChange(Navigation,tdElement,linkIndex,bisMouseOver) {
	if (Navigation.mouseoverEffect != 'true') {
		return;
	}	
	var link = Navigation.links[linkIndex-1];
	var bIsCurrentPage = isCurrentPage(link);
	var bShowMouseoverBg = !(bIsCurrentPage
			&& 'true' == Navigation.selectedEffect && Navigation.selectedBgcolor);
	var fontElement = getLinkFontElement(tdElement);
	if(fontElement != null) {
		doFontChange(Navigation,fontElement,bIsCurrentPage,bisMouseOver);
	}
	
	if (Navigation.mouseoverBgcolor && bShowMouseoverBg) {
		if(bisMouseOver) {
			backgroundMouseOn(tdElement,Navigation.mouseoverBgcolor);
		} else {
			backgroundMouseOff(tdElement);
		}
	}
}
function addStyle(Navigation, Link, tdElement,vNavTrElement) {
	if (tdElement == null) {
		return;
	}
	var strFontColor = Navigation.textColor;
	if ('true' == Navigation.selectedEffect) {
		if (Navigation.selectedTextcolor) {
			strFontColor = Navigation.selectedTextcolor;
		}
		if (Navigation.selectedBgcolor) {
			if (Navigation.orientation == 'horizontal') {
				tdElement.style.backgroundColor = Navigation.selectedBgcolor;
			} else {
				if (vNavTrElement != null) {
					vNavTrElement.style.backgroundColor = Navigation.selectedBgcolor;
				}
			}
		}
	}
	var fontElement = getLinkFontElement(tdElement);
	if (fontElement != null) {
		fontElement.style.color = strFontColor;
	}
	tdElement.style.color = strFontColor;
	if ('true' == Navigation.selectedEffect) {
		if ('true' == Navigation.selectedBold) {
			tdElement.style.fontWeight = "bold";
		}
		if ('true' == Navigation.selectedItalic) {
			tdElement.style.fontStyle = "italic";
		}
		if ('true' == Navigation.selectedUnderline) {
			tdElement.style.textDecoration = "underline";
		}
	}
}

// Combined escape html and javascript
function escapeHtmlInlineScript(s, escapeSingleQuotes, escapeDoubleQuotes){
	return htmlEncode(escapeScript(s, escapeSingleQuotes, escapeDoubleQuotes));
}

function htmlEncode(s){
	if (typeof(s) != "string") return "";
	
	var result = "";
	for (var i = 0; i < s.length; i++) {
		var ch = s.charAt(i);
		switch (ch) {
		case '<':
			result += "&lt;";
			break;
		case '>':
			result += "&gt;";
			break;
		case '&':
			result += "&amp;";
			break;
		case '"':
			result += "&quot;";
			break;
		case "'":
			result += "&#39;";
			break;
		default:
			result += ch;
		}
	}
	return result;
}

/* escapes slashes and quotes. the default is to escape quotes,
 * but this can be turned off.
 * this function is used for javascript and also for escaping urls
 * within background-image css.	 
 */
function escapeScript(s, escapeSingleQuotes, escapeDoubleQuotes){
	if (typeof(s) != "string") return "";
	
	var result = "";
	for (var i = 0; i < s.length; i++) {
		var ch = s.charAt(i);
		switch (ch) {
		case '\'':
			if (escapeSingleQuotes == null || escapeSingleQuotes)
				result += "\\\'";
			break;
		case '\"':
			if (escapeDoubleQuotes == null || escapeDoubleQuotes)
				result += "\\\"";
			break;
		case '\\':
			result += "\\\\";
			break;
		default:
			result += ch;
		}
	}
	return result;
}

//
// This .js file includes utility functions used by both graphical and text navs
// in their rendering.  User pages including a nav element will import this file, along
// with TextNavigation.js and GraphicNavigation.js.  The functions within will
// be called by the [navname].js file generated at publish time.

function fixLinkValue(Link)
{
	if(Link.type!='existing')
	{
		return Link.linkValue;
	}
	else
	{
		return baseHref + strRelativePathToRoot + Link.linkValue;
	}
}

function isCurrentPage(Link)
{
	if(Link.type!='existing')
	{
		return false;
	}
	var strLinkValue = Link.linkValue.toLowerCase();
	return (strRelativePagePath == strLinkValue);
}

function toggleOnMouseChange(fontElement,newColor, bold, underline, italic)
{
	if(fontElement == null) {
		return;
	}
	if(newColor)
	{
		fontElement.style.color=newColor;
	}
	fontElement.style.fontWeight = (bold=='true' ? 'bold' : 'normal');
	fontElement.style.textDecoration = (underline=='true' ? 'underline' : 'none');
	fontElement.style.fontStyle = (italic=='true' ? 'italic' : 'normal');

}

function doFontChange(Navigation,fontElement,bIsCurrentPage,bisMouseOver) {
	if(fontElement == null) {
		return;
	}
	var textColor;
	var baseTextColor = Navigation.textColor;
	var bold;
	var baseBold = Navigation.bold;
	var underline;
	var baseUnderline = Navigation.underline;
	var italic;
	var baseItalic = Navigation.italic;
	if (bIsCurrentPage && 'true' == Navigation.selectedEffect) {
		textColor = Navigation.selectedTextcolor ? Navigation.selectedTextcolor
				: (Navigation.mouseoverTextColor ? Navigation.mouseoverTextcolor
						: Navigation.textColor);
		baseTextColor = Navigation.selectedTextcolor ? Navigation.selectedTextcolor
				: Navigation.textColor;
		baseBold = bold = Navigation.selectedBold;
		baseUnderline = underline = Navigation.selectedUnderline;
		baseItalic = italic = Navigation.selectedItalic;
	} else {
		textColor = Navigation.mouseoverTextcolor ? Navigation.mouseoverTextcolor
				: Navigation.textColor;
		bold = Navigation.mouseoverBold;
		underline = Navigation.mouseoverUnderline;
		italic = Navigation.mouseoverItalic;
	}
	
	if(bisMouseOver) {
		toggleOnMouseChange(fontElement,textColor,bold,underline,italic);
	} else {
		toggleOnMouseChange(fontElement,baseTextColor,baseBold,baseUnderline,baseItalic);
	}
	

}

function addMouseAndStyleSupportQuickSiteMain(Navigation,navTbId) {
	var startNode;

	if(typeof(nav_element_id) != 'undefined' && document.getElementById(nav_element_id) != null) {
		startNode = document.getElementById(nav_element_id);
			
	} else if(navTbId != null) {
		startNode = document.getElementById(navTbId);
			
	}
	
	if(startNode != null) {
	  searchForCurrentPageTd(Navigation,startNode);
	}
	

}

function searchForCurrentPageTd(Navigation,startNode) {
	
	if(startNode.childNodes != null) {
		for(var i=0;i<startNode.childNodes.length;i++){
			if(addStyleForCurrentPageTd(Navigation,startNode.childNodes[i])){
			   return;	
			} else {
			   searchForCurrentPageTd(Navigation,startNode.childNodes[i]);
			}
		}
	}

}

function addStyleForCurrentPageTd(Navigation,currentNode) {
	if(Navigation.orientation == 'horizontal') {
		if(currentNode.tagName == 'TD' && currentNode.id != '' && currentNode.id.indexOf(Navigation.navName+navTDLinkPart) != -1){
			var currentTDIdPrefix = Navigation.navName+navTDLinkPart;
			var linkId = currentNode.id.substring(currentTDIdPrefix.length,currentNode.id.length);
			if(isCurrentPage(Navigation.links[linkId-1]) == true) {
				addStyle(Navigation, Navigation.links[linkId-1],currentNode);
				return true;
			}
		}
	} else {
		if(currentNode.tagName == 'TR' && currentNode.id != '' && currentNode.id.indexOf(navTRLinkPrefix) != -1){	
			var currentTRIdPrefix = navTRLinkPrefix+Navigation.navName;
			var linkId = currentNode.id.substring(currentTRIdPrefix.length,currentNode.id.length);
			if(isCurrentPage(Navigation.links[linkId-1]) == true && currentNode.childNodes != null) {
				var currentPageTd;
				for(var i=0;currentNode.childNodes.length;i++) {
					if(typeof(currentNode.childNodes[i].tagName) != 'undefined' && currentNode.childNodes[i].tagName == 'TD' && currentNode.childNodes[i].id.indexOf(Navigation.navName+navTDLinkPart) != -1) {
						currentPageTd = currentNode.childNodes[i];
						addStyle(Navigation, Navigation.links[linkId - 1],currentPageTd,currentNode);
						return true;
					}
				}
			}
		}
	}
	return false;
}

function getChildElementFromTree(startNode,nodesToTraverse) {
	var currentChildNode = startNode;
	
	for(var n= 0;n<nodesToTraverse.length;n++) {
		currentChildNode = getMatchingChildByTag(currentChildNode.childNodes,nodesToTraverse[n]);
	}
	
	return currentChildNode;
}


function getMatchingChildByTag(childNodes,tagName) {
	var child;
	for(var i=0;childNodes.length;i++) {
		if(childNodes[i].tagName == tagName) {
			child = childNodes[i];
			break;
		}
	}
	return child;
}
function getLinkFontElement(tdElement){
	var fontElement;
	var aElement = getChildElementFromTree(tdElement,['A']);
	for(var i=0;i < aElement.childNodes.length;i++) {
		if(aElement.childNodes[i].tagName == 'DIV') {
		 	fontElement = getChildElementFromTree(aElement.childNodes[i],['FONT']);
		 	break;
		} else if(aElement.childNodes[i].tagName == 'FONT'){
		 	fontElement = 	aElement.childNodes[i];
		 	break;
		}
	
	}
	return fontElement;
}



	if(typeof(navTRLinkPrefix) == 'undefined') {
		navTRLinkPrefix = 'vNavTR_Link_';
	}
	if(typeof(navTDLinkPart) == 'undefined') {
		navTDLinkPart = '_Link';
	}
	if(document.getElementById('nav_version') == null) {
	if (typeof(navTBSuffix) == 'undefined') {
	navTBSuffix = 0;
	} else {navTBSuffix++;}
		document.write('<TABLE ID="ntb'+navTBSuffix+'"  CELLSPACING=\"0\" CELLPADDING=\"0\" BORDER=\"0\" ><TR id=\"vNavTR_Link_QuickSiteMain1\"><TD ALIGN=\"right\" VALIGN=\"MIDDLE\" NOWRAP=\"NOWRAP\" id=\"QuickSiteMain_Link1\" style=\"cursor: pointer;cursor: hand;color:#ffffff;font-weight: bold;\" onmouseover=\"doMouseChange(nav_QuickSiteMain,this,\'1\',true);\" onmouseout=\"doMouseChange(nav_QuickSiteMain,this,\'1\',false);\"><A HREF=\"\/index.html\" TARGET=\"_self\" STYLE=\"text-decoration:none;\" NAME=\"Home\"><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><BR><FONT ID=\"QuickSiteMain_f1\" FACE=\"Arial, Helvetica, sans-serif\" CLASS=\"size14 Arial14\" STYLE=\"color:#ffffff\">Home<\/FONT><BR><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><\/A><\/TD><\/TR><TR id=\"vNavTR_Link_QuickSiteMain2\"><TD ALIGN=\"right\" VALIGN=\"MIDDLE\" NOWRAP=\"NOWRAP\" id=\"QuickSiteMain_Link2\" style=\"cursor: pointer;cursor: hand;color:#ffffff;font-weight: bold;\" onmouseover=\"doMouseChange(nav_QuickSiteMain,this,\'2\',true);\" onmouseout=\"doMouseChange(nav_QuickSiteMain,this,\'2\',false);\"><A HREF=\"\/Technology.html\" TARGET=\"_self\" STYLE=\"text-decoration:none;\" NAME=\"Technology\"><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><BR><FONT ID=\"QuickSiteMain_f2\" FACE=\"Arial, Helvetica, sans-serif\" CLASS=\"size14 Arial14\" STYLE=\"color:#ffffff\">Technology<\/FONT><BR><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><\/A><\/TD><\/TR><TR id=\"vNavTR_Link_QuickSiteMain3\"><TD ALIGN=\"right\" VALIGN=\"MIDDLE\" NOWRAP=\"NOWRAP\" id=\"QuickSiteMain_Link3\" style=\"cursor: pointer;cursor: hand;color:#ffffff;font-weight: bold;\" onmouseover=\"doMouseChange(nav_QuickSiteMain,this,\'3\',true);\" onmouseout=\"doMouseChange(nav_QuickSiteMain,this,\'3\',false);\"><A HREF=\"\/Music.html\" TARGET=\"_self\" STYLE=\"text-decoration:none;\" NAME=\"Music\"><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><BR><FONT ID=\"QuickSiteMain_f3\" FACE=\"Arial, Helvetica, sans-serif\" CLASS=\"size14 Arial14\" STYLE=\"color:#ffffff\">Music<\/FONT><BR><IMG SRC=\"\/tp.gif\" WIDTH=\"1\" HEIGHT=\"18.0\" BORDER=\"0\"><\/A><\/TD><\/TR><\/TABLE><script type="text/javascript">addMouseAndStyleSupportQuickSiteMain(nav_QuickSiteMain,"ntb'+navTBSuffix+'");'+'</scri'+'pt>');
	}

