goog.provide('org.koshinuke.main');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.TabBar');
goog.require('goog.positioning.Corner');
goog.require('goog.ui.Tooltip');
goog.require('goog.ui.PopupMenu');
goog.require('goog.ui.TableSorter');

org.koshinuke.main = function() {
	var topTab = new goog.ui.TabBar();
	topTab.decorate(goog.dom.getElement('toptab'));
	topTab.setSelectedTabIndex(0);
	goog.events.listen(topTab, goog.ui.Component.EventType.SELECT, function(e) {
		console.log('toptab')
		console.log(e);

	});
	var projmenu = new goog.ui.PopupMenu();
	var projel = goog.dom.getElement('project_menu');
	projmenu.setToggleMode(true);
	projmenu.decorate(projel);
	goog.array.forEach(goog.dom.query('#project_menu a'), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			e.preventDefault();
			var parent = goog.dom.getElement('project_link');
			var oldone = parent.firstChild;
			var newone = el.firstChild;
			// hrefの中身もね。
			parent.replaceChild(newone.cloneNode(), oldone);
			el.replaceChild(oldone.cloneNode(), newone);

		});
	});
	goog.events.listen(projmenu, goog.ui.Component.EventType.ACTION, function(e) {
		console.log("projmenu");
		console.log(e);
	});
	var projSideTab = new goog.ui.TabBar();
	projSideTab.currentPane = 'git_contents';
	projSideTab.decorate(goog.dom.getElement('sidemenu_projects'));

	function switchProjectSideTab(e, active) {
		var el = goog.dom.query('a',e.target.getElement())[0];
		var path = el.getAttribute(active);
		el.firstChild.src = path;
		var next = el.getAttribute('for');
		switchTab(projSideTab, next);
	}


	goog.events.listen(projSideTab, goog.ui.Component.EventType.SELECT, function(e) {
		switchProjectSideTab(e, "active");
	});
	goog.events.listen(projSideTab, goog.ui.Component.EventType.UNSELECT, function(e) {
		switchProjectSideTab(e, "inactive");
	});
	projSideTab.setSelectedTabIndex(0);
	goog.array.forEach(goog.dom.query('#sidemenu_projects a'), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			//e.preventDefault();
			console.log(el);
		});
	});
	var repomenu = new goog.ui.PopupMenu();
	var reposel = goog.dom.getElement('repo_menu');
	repomenu.setToggleMode(true);
	repomenu.decorate(reposel);
	goog.array.forEach(goog.dom.query('#repo_menu a'), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			e.preventDefault();
			console.log(el);
		});
	});
	var projMainTab = new goog.ui.TabBar();
	// hack
	projMainTab.currentPane = 'resource_pane';
	projMainTab.decorate(goog.dom.getElement('project_main_tab'));

	function switchTab(tabbar, next) {
		function toggleTab(paneId, is) {
			var content = goog.dom.getElement(paneId);
			if(content) {
				goog.style.showElement(content, is);
			}
		}

		toggleTab(tabbar.currentPane, false);
		toggleTab(next, true);
		tabbar.currentPane = next;
	}

	goog.events.listen(projMainTab, goog.ui.Component.EventType.ACTION, function(e) {
		var el = e.target.getElement();
		var next = el.getAttribute('for');
		switchTab(projMainTab, next);
	});

	var tagstable = new goog.ui.TableSorter();
	var tagsEl = goog.dom.getElement('tags_table');
	tagstable.decorate(tagsEl);
	tagstable.setDefaultSortFunction(goog.ui.TableSorter.alphaSort);
	tagstable.setSortFunction(0, goog.ui.TableSorter.noSort);
	
	goog.events.listen(tagsEl, goog.events.EventType.CLICK, function(e) {
		var maybeA = e.target;
		var next = maybeA.getAttribute('for');
		if(next) {
			e.preventDefault();
			switchTab(projMainTab, next);
		}
	});

	goog.dom.query('.tooltipable').forEach(function(el) {
		var tooltip = new goog.ui.Tooltip(el);
		tooltip.getPositioningStrategy = function(activationType) {
			return new goog.positioning.AnchoredPosition(goog.dom.getElement(el), goog.positioning.Corner.TOP_RIGHT);
		};
		var text = el.getAttribute('alt');
		tooltip.className = 'twipsy right';
		tooltip.setHtml('<div><div class="twipsy-arrow"></div><div class="twipsy-inner">' + text + '</div></div>');
	});
	//
	//
	goog.dom.query('.selectable').forEach(function(el) {
		var pm = new goog.ui.PopupMenu();
		pm.decorate(el);
		pm.attach(goog.dom.getPreviousElementSibling(el), goog.positioning.Corner.BOTTOM_LEFT);
		goog.events.listen(pm, goog.ui.Component.EventType.ACTION, function(e) {
			console.log("ACTION");
			console.log(e);
		});
	});
	//
	//
	/**
	 * @constructor
	 * @extends {goog.positioning.AbstractPosition}
	 */
	GravityPosition = function(el, g, margin) {
		this.baseEl_ = el;
		this.gravity_ = g ? g : 'n';
		this.margin_ = margin ? margin : 0;
	}
	goog.inherits(GravityPosition, goog.positioning.AbstractPosition);
	GravityPosition.prototype.reposition = function(element, popupCorner, opt_margin, opt_preferredSize) {
		var size = goog.style.getSize(this.baseEl_);
		var basePos = goog.style.getPosition(this.baseEl_);
		var pos = {
			left : basePos.x,
			top : basePos.y,
			height : size.height,
			width : size.width
		};
		var actualWidth = element.offsetWidth;
		actualHeight = element.offsetHeight;
		var gravity = this.gravity_;
		var tp;
		switch (gravity.charAt(0)) {
			case 'n':
				tp = {
					top : pos.top + pos.height + this.margin_,
					left : pos.left + pos.width / 2 - actualWidth / 2
				};
				break;
			case 's':
				tp = {
					top : pos.top - actualHeight - this.margin_,
					left : pos.left + pos.width / 2 - actualWidth / 2
				};
				break;
			case 'e':
				tp = {
					top : pos.top + pos.height / 2 - actualHeight / 2,
					left : pos.left - actualWidth - this.margin_
				};
				break;
			case 'w':
				tp = {
					top : pos.top + pos.height / 2 - actualHeight / 2,
					left : pos.left + pos.width + this.margin_
				};
				break;
		}
		goog.style.setPosition(element, tp.left, tp.top);
	};
	function clipHtml(text) {
		return '<div><div class="twipsy-arrow"></div><div class="twipsy-inner">' + text + '</div></div>';
	}

	var copyTip = new goog.ui.Tooltip();
	copyTip.className = 'twipsy right';
	copyTip.setHtml(clipHtml('copy to clipboard'));
	var compTip = new goog.ui.Tooltip();
	compTip.className = 'twipsy right';
	compTip.setHtml(clipHtml('copied !!'));

	window['ZeroClipboard']['setMoviePath']('flash/ZeroClipboard.swf');
	var clip = new window['ZeroClipboard']['Client'];
	clip['addEventListener']('onMouseOver', function(client) {
		var el = goog.dom.getElement('clip-btn');
		el.setAttribute("src", "images/copy_button_over.png");
		copyTip.showForElement(el, new GravityPosition(el, 'w', 3));
	});
	clip['addEventListener']('onMouseOut', function(client) {
		goog.dom.getElement('clip-btn').setAttribute("src", "images/copy_button_up.png");
		copyTip.setVisible(false);
		compTip.setVisible(false);
	});
	clip['addEventListener']('onMouseUp', function(client) {
		goog.dom.getElement('clip-btn').setAttribute("src", "images/copy_button_up.png");
	});
	clip['addEventListener']('onMouseDown', function(client) {
		var el = goog.dom.getElement('clip-btn');
		el.setAttribute("src", "images/copy_button_down.png");
		var txt = goog.dom.getElement('url-box').value;
		clip["setText"](txt);
	});
	clip['addEventListener']('onComplete', function(client, text) {
		var el = goog.dom.getElement('clip-btn');
		compTip.showForElement(el, new GravityPosition(el, 'w', 3));
	});
	clip['glue']("clip-btn", "clip-container");
	goog.events.listen(goog.dom.getElement("url-box"), goog.events.EventType.CLICK, function(e) {
		goog.dom.getElement("url-box").select();
	});
	var repoTab = new goog.ui.TabBar();
	repoTab.decorate(goog.dom.getElement('protocols'));
	repoTab.setSelectedTabIndex(0);
	// Object #<NodeList> has no method 'forEach' と怒られる。
	// goog.dom.queryはarrayを返す時と、NodeList返す時がある。
	//goog.dom.query('#protocols a').forEach(function(el){
	goog.array.forEach(goog.dom.query('#protocols a'), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			e.preventDefault();
			goog.dom.getElement("url-box").value = el.getAttribute('href');
			var parent = goog.dom.getElement("url-desc");
			var newone = goog.dom.createTextNode(el.getAttribute('desc'));
			var oldone = parent.firstChild;
			parent.replaceChild(newone, oldone);
		});
	});
	//
	//
	goog.array.forEach(goog.dom.query('.resource_table'), function(el) {
		var component = new goog.ui.TableSorter();
		component.decorate(el);
		component.setDefaultSortFunction(goog.ui.TableSorter.alphaSort);
		component.setSortFunction(0, goog.ui.TableSorter.noSort);
	});

};
goog.exportSymbol('org.koshinuke.main', org.koshinuke.main);
