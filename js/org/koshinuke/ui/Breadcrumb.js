goog.provide('org.koshinuke.ui.Breadcrumb');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.soy');

/**
 * @constructor
 */
org.koshinuke.ui.Breadcrumb = function(el) {
	this.el = el;
	this.root = "Branches";
	this.name = "master";
	this.path = "";
}
/**
 * @private
 */
org.koshinuke.ui.Breadcrumb.prototype.li_ = function(args) {
	return goog.soy.renderAsElement(org.koshinuke.template.breadcrumb_li, {
		href : "#", // TODO make url
		view : args
	});
}
org.koshinuke.ui.Breadcrumb.prototype.receive = function(locationdata) {
	if(locationdata.root) {
		this.root = locationdata.root;
	}
	if(locationdata.name) {
		this.name = locationdata.name;
	}
	if(locationdata.path) {
		this.path = locationdata.path;
	}
	this.remake();
}
org.koshinuke.ui.Breadcrumb.prototype.remake = function() {
	goog.dom.removeChildren(this.el);
	this.el.appendChild(this.li_(this.root));
	this.el.appendChild(this.li_(this.name));

	if(this.path) {
		goog.array.forEach(path.split('/'), function(p) {
			if(p) {
				this.el.appendChild(this.li_(p));
			}
		});
	}
};
