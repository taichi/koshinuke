goog.provide('org.koshinuke');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.graphics');
goog.require('goog.graphics.Font');
goog.require('goog.graphics.SvgGraphics');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.pubsub.PubSub');
goog.require('goog.positioning.Corner');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('goog.Uri');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.IdGenerator');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.Tooltip');
goog.require('goog.ui.PopupMenu');
goog.require('goog.ui.TableSorter');
goog.require('goog.ui.tree.TreeControl');
goog.require('ZeroClipboard');
goog.require('outliner.createOutline');

goog.require('org.koshinuke.positioning.GravityPosition');
goog.require('org.koshinuke.template');
goog.require('org.koshinuke.ui.Breadcrumb');

function renderOutlineTree() {
	function text(node) {
		if(node.nodeType == 3) {
			return node.nodeValue;
		} else {
			if(node.nodeName.toLowerCase() == 'img') {
				return node.getAttribute('alt') || '';
			} else {
				return (function f(node) {
					return node ? text(node) + f(node.nextSibling) : '';
				})(node.firstChild);
			}
		}
	}

	function addElement(parent, section, tag) {
		var el = section.headElement || section.element;
		var content = text(el).replace(/\s+/g, ' ');
		var n = "#" + goog.ui.IdGenerator.instance.getNextUniqueId();
		var to = goog.dom.createDom('a', {
			name : n
		});
		goog.dom.insertSiblingBefore(to, el);
		var txt = goog.dom.createTextNode(content);
		var from = goog.dom.createDom('a', {
			href : n
		});
		from.appendChild(txt);
		var newone = goog.dom.createElement(tag);
		newone.appendChild(from);
		parent.appendChild(newone);
	}

	var src = outliner.createOutline(document);
	var parent = goog.dom.getElement('doc_side_outline');
	goog.array.forEach(src, function(outer) {
		addElement(parent, outer, 'dt');
		var kids = outer.childs;
		if(kids) {
			goog.array.forEach(kids, function(section) {
				addElement(parent, section, 'dd');
			});
		}
	});
}

function renderDocumentTree() {
	var conf = goog.ui.tree.TreeControl.defaultConfig;
	conf['cleardotPath'] = 'images/cleardot.gif';
	var tree = new goog.ui.tree.TreeControl("root", conf);
	renderRemoteData('doc_list.json', function(e) {
		function makeTree(node, json) {
			if(json[0]) {
				node.setText(json[0]);
			}
			if(json[1]) {
				goog.array.forEach(json[1], function(d) {
					var newone = node.getTree().createNode();
					node.add(newone);
					makeTree(newone, d);
				});
			}
		}

		var data = goog.json.parse(e.target.getResponseText());
		makeTree(tree, data);

		tree.render(goog.dom.getElement('doc_side_lists'));
	});
	return tree;
}

function renderRemoteData(path, fn) {
	var ownUri = new goog.Uri(window.location.href);
	var dataUri = ownUri.resolve(new goog.Uri(path));
	goog.net.XhrIo.send(dataUri.toString(), fn);
}

function renderCommitGraph() {
	renderRemoteData('BranchGraph.xml', function(e) {
		var svg = e.target.getResponseText();
		var el = goog.dom.getElement("commitGraph");
		el.innerHTML = svg;
	});
}

goog.exportSymbol('org.koshinuke.main', function() {
	renderCommitGraph();
	renderOutlineTree();
	org.koshinuke.PubSub = new goog.pubsub.PubSub();
	UI_REPOSITION = "ui.reposition";
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
		org.koshinuke.PubSub.publish(UI_REPOSITION);
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

	function listenSwitch(tab) {
		goog.events.listen(tab, goog.ui.Component.EventType.SELECT, function(e) {
			var el = e.target.getElement();
			var next = el.getAttribute('for');
			switchTab(tab, next);
		});
	}

	listenSwitch(projMainTab);

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
	ZeroClipboard.setMoviePath('flash/ZeroClipboard.swf');

	function clipHtml(text) {
		return '<div><div class="twipsy-arrow"></div><div class="twipsy-inner">' + text + '</div></div>';
	}

	function makeRepoBar(btnel) {
		var copyTip = new goog.ui.Tooltip();
		copyTip.className = 'twipsy right';
		copyTip.setHtml(clipHtml('copy to clipboard'));
		var compTip = new goog.ui.Tooltip();
		compTip.className = 'twipsy right';
		compTip.setHtml(clipHtml('copied !!'));

		var clip = new ZeroClipboard.Client();
		clip.addEventListener('onMouseOver', function(client) {
			var el = client.domElement;
			el.setAttribute("src", "images/copy_button_over.png");
			copyTip.showForElement(el, new org.koshinuke.positioning.GravityPosition(el, 'w', 3));
		});
		clip.addEventListener('onMouseOut', function(client) {
			client.domElement.setAttribute("src", "images/copy_button_up.png");
			copyTip.setVisible(false);
			compTip.setVisible(false);
		});
		clip.addEventListener('onMouseUp', function(client) {
			client.domElement.setAttribute("src", "images/copy_button_up.png");
		});
		clip.addEventListener('onMouseDown', function(client) {
			var el = client.domElement;
			el.setAttribute("src", "images/copy_button_down.png");
			var txt = goog.dom.getElement(el.getAttribute('from')).value;
			clip.setText(txt);
		});
		clip.addEventListener('onComplete', function(client, text) {
			compTip.showForElement(client.domElement, new org.koshinuke.positioning.GravityPosition(el, 'w', 3));
		});
		org.koshinuke.PubSub.subscribe(UI_REPOSITION, clip.reposition, clip);

		var cc = goog.dom.getElement(btnel);
		clip.glue(cc, cc.parentNode);
	}


	goog.array.forEach(goog.dom.query(".url-box"), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			var t = e.target;
			if(t) {
				t.select();
			}
		});
	});
	goog.array.forEach(goog.dom.query(".protocols"), function(el) {
		var repoTab = new goog.ui.TabBar();
		repoTab.decorate(el);
		repoTab.setSelectedTabIndex(0);
	});
	// Object #<NodeList> has no method 'forEach' と怒られる。
	// goog.dom.queryはarrayを返す時と、NodeList返す時がある。
	goog.array.forEach(goog.dom.query('.protocols a'), function(el) {
		goog.events.listen(el, goog.events.EventType.CLICK, function(e) {
			e.preventDefault();
			goog.dom.getElement(el.getAttribute('for')).value = el.getAttribute('href');
			var parent = goog.dom.getElement(el.getAttribute('descat'));
			var newone = goog.dom.createTextNode(el.getAttribute('desc'));
			var oldone = parent.firstChild;
			parent.replaceChild(newone, oldone);
		});
	});
	//
	//
	makeRepoBar('clip-btn');
	makeRepoBar('doc-clip-btn');

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
	//
	//
	var ttTab = new goog.ui.TabBar();
	// hack
	ttTab.currentPane = 'tt_list_pane';
	ttTab.decorate(goog.dom.getElement('tt_tab'));
	listenSwitch(ttTab);
	ttTab.setSelectedTabIndex(0);
	//
	//
	var docMainTab = new goog.ui.TabBar();
	// hack
	docMainTab.currentPane = 'doc_main_pane';
	docMainTab.decorate(goog.dom.getElement('document_tab'));
	listenSwitch(docMainTab);
	docMainTab.setSelectedTabIndex(0);
	//
	//
	var docSidebarTab = new goog.ui.TabBar();
	// hack
	docSidebarTab.currentPane = 'doc_side_lists';
	docSidebarTab.decorate(goog.dom.getElement('doc_sidebar_tab'));
	listenSwitch(docSidebarTab);
	goog.events.listen(docSidebarTab, goog.ui.Component.EventType.SELECT, function(e) {
		var el = e.target.getElement();
		goog.dom.classes.add(el, "active");
		goog.dom.classes.remove(el, "inactive");
	});
	goog.events.listen(docSidebarTab, goog.ui.Component.EventType.UNSELECT, function(e) {
		var el = e.target.getElement();
		goog.dom.classes.add(el, "inactive");
		goog.dom.classes.remove(el, "active");
	});
	docSidebarTab.setSelectedTabIndex(0);

	var docListsTree = renderDocumentTree();
	goog.events.listen(docListsTree, goog.ui.Component.EventType.CHANGE, function(e) {
		var selected = e.target.getSelectedItem();
		if(selected) {
			console.log(selected.getText());
		}
	});
	var myTextArea = goog.dom.getElement('editor-textarea');
	window.cm = CodeMirror(function(elt) {
		myTextArea.parentNode.replaceChild(elt, myTextArea);
	}, {
		mode : "markdown",
		lineNumbers : true,
		lineWrapping : true,
		value : myTextArea.value
	});
});
