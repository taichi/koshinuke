goog.provide('org.koshinuke');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.graphics');
goog.require('goog.graphics.Font');
goog.require('goog.graphics.SvgGraphics');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.pubsub.PubSub');
goog.require('goog.positioning.Corner');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('goog.Uri');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.Tooltip');
goog.require('goog.ui.PopupMenu');
goog.require('goog.ui.TableSorter');
goog.require('ZeroClipboard');

goog.require('org.koshinuke.positioning.GravityPosition');
goog.require('org.koshinuke.template');
goog.require('org.koshinuke.ui.Breadcrumb');

function renderCommitGraph() {
	var ownUri = new goog.Uri(window.location.href);
	var dataUri = ownUri.resolve(new goog.Uri('BranchGraph.xml'));
	goog.net.XhrIo.send(dataUri.toString(), function(e){
		var svg = e.target.getResponseText();
		var el = goog.dom.getElement("commitGraph");
		el.innerHTML = svg;
	});
}

goog.exportSymbol('org.koshinuke.main', function() {
	renderCommitGraph();
	org.koshinuke.PubSub = new goog.pubsub.PubSub();
	REPO_LOCATION_STATE = "repo.loc.state";

	var topTab = new goog.ui.TabBar();
	topTab.decorate(goog.dom.getElement('toptab'));
	topTab.setSelectedTabIndex(0);
	goog.events.listen(topTab, goog.ui.Component.EventType.SELECT, function(e) {
		console.log('toptab');
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
	projSideTab.setSelectedTabIndex(2);
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
	var breadcrumb = new org.koshinuke.ui.Breadcrumb(goog.dom.getElement('locationpath'));
	org.koshinuke.PubSub.subscribe(REPO_LOCATION_STATE, breadcrumb.receive, breadcrumb);

	//
	//
	var projMainTab = new goog.ui.TabBar();
	// hack
	projMainTab.currentPane = 'branch_pane';
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


	goog.events.listen(projMainTab, goog.ui.Component.EventType.SELECT, function(e) {
		var el = e.target.getElement();
		var next = el.getAttribute('for');
		switchTab(projMainTab, next);
	});

	goog.array.forEach([{
		id : "branch_table",
		root : "Branches"
	}, {
		id : "tags_table",
		root : "Tags"
	}], function(obj) {
		var tagsEl = goog.dom.getElement(obj.id);
		goog.events.listen(tagsEl, goog.events.EventType.CLICK, function(e) {
			var maybeA = e.target;
			var next = maybeA.getAttribute('for');
			if(next) {
				e.preventDefault();
				switchTab(projMainTab, next);
				org.koshinuke.PubSub.publish(REPO_LOCATION_STATE, {
					root : obj.root,
					name : maybeA.firstChild.textContent
					// path : TODO how to send path ?
				});
			}
		});
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
	function clipHtml(text) {
		return '<div><div class="twipsy-arrow"></div><div class="twipsy-inner">' + text + '</div></div>';
	}

	var copyTip = new goog.ui.Tooltip();
	copyTip.className = 'twipsy right';
	copyTip.setHtml(clipHtml('copy to clipboard'));
	var compTip = new goog.ui.Tooltip();
	compTip.className = 'twipsy right';
	compTip.setHtml(clipHtml('copied !!'));

	ZeroClipboard.setMoviePath('flash/ZeroClipboard.swf');

	var clip = new ZeroClipboard.Client();
	clip.addEventListener('onMouseOver', function(client) {
		var el = goog.dom.getElement('clip-btn');
		el.setAttribute("src", "images/copy_button_over.png");
		copyTip.showForElement(el, new org.koshinuke.positioning.GravityPosition(el, 'w', 3));
	});
	clip.addEventListener('onMouseOut', function(client) {
		goog.dom.getElement('clip-btn').setAttribute("src", "images/copy_button_up.png");
		copyTip.setVisible(false);
		compTip.setVisible(false);
	});
	clip.addEventListener('onMouseUp', function(client) {
		goog.dom.getElement('clip-btn').setAttribute("src", "images/copy_button_up.png");
	});
	clip.addEventListener('onMouseDown', function(client) {
		var el = goog.dom.getElement('clip-btn');
		el.setAttribute("src", "images/copy_button_down.png");
		var txt = goog.dom.getElement('url-box').value;
		clip.setText(txt);
	});
	clip.addEventListener('onComplete', function(client, text) {
		var el = goog.dom.getElement('clip-btn');
		compTip.showForElement(el, new org.koshinuke.positioning.GravityPosition(el, 'w', 3));
	});
	clip.glue("clip-btn", "clip-container");

	goog.events.listen(goog.dom.getElement("url-box"), goog.events.EventType.CLICK, function(e) {
		goog.dom.getElement("url-box").select();
	});
	var repoTab = new goog.ui.TabBar();
	repoTab.decorate(goog.dom.getElement('protocols'));
	repoTab.setSelectedTabIndex(0);
	// Object #<NodeList> has no method 'forEach' と怒られる。
	// goog.dom.queryはarrayを返す時と、NodeList返す時がある。
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
	function updateFilter() {
		var cond = goog.array.map(goog.array.filter(goog.dom.query("#branch_filters input"), function(v) {
			return v.checked;
		}), function(v) {
			return v.value;
		});

		goog.array.forEach(goog.dom.query("#branch_table tbody tr"), function(row) {
			var shown = false;
			goog.array.forEach(goog.dom.classes.get(row), function(v) {
				shown |= goog.array.contains(cond, v);
			});
			goog.style.showElement(row, shown);
		});
	}

	updateFilter();

	goog.events.listen(goog.dom.getElement('branch_filters'), goog.events.EventType.CLICK, function(e) {
		var t = e.target;
		if(t && t.value) {
			var label = t.parentNode;
			if(t.checked) {
				goog.dom.classes.add(label, "active");
			} else {
				goog.dom.classes.remove(label, "active");
			}
			updateFilter();
		}
	});
	//
	//
	goog.array.forEach(goog.dom.query('.icon_table'), function(el) {
		var component = new goog.ui.TableSorter();
		component.decorate(el);
		component.setDefaultSortFunction(goog.ui.TableSorter.alphaSort);
		component.setSortFunction(0, goog.ui.TableSorter.noSort);
	});
});
