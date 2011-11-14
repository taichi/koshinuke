// This file was automatically generated from helpcontents.soy.
// Please don't edit this file by hand.

goog.provide('org.koshinuke.template.helpcontents');

goog.require('soy');
goog.require('soy.StringBuilder');


org.koshinuke.template.helpcontents.tmpl = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div class="refs toolbox"><div class="refs-nav"><ul class="refs-parent">');
  var pList4 = opt_data.parents;
  var pListLen4 = pList4.length;
  for (var pIndex4 = 0; pIndex4 < pListLen4; pIndex4++) {
    var pData4 = pList4[pIndex4];
    output.append('<li class="', (pIndex4 == 0) ? 'active' : '', '"><a href="#" for="', pData4.f, '">', soy.$$escapeHtml(pData4.label), '</a></li>');
  }
  output.append('</ul>');
  var kList17 = opt_data.kids;
  var kListLen17 = kList17.length;
  for (var kIndex17 = 0; kIndex17 < kListLen17; kIndex17++) {
    var kData17 = kList17[kIndex17];
    output.append('<ul id="', soy.$$escapeHtml(kData17.id), '" class="refs-kids ', (kIndex17 == 0) ? 'active' : '', '">');
    var lList25 = kData17.labels;
    var lListLen25 = lList25.length;
    for (var lIndex25 = 0; lIndex25 < lListLen25; lIndex25++) {
      var lData25 = lList25[lIndex25];
      output.append('<li class="', (lIndex25 == 0) ? 'active' : '', '"><a href="#" cid="', lData25.cid, '" pid="', lData25.pid, '">', soy.$$escapeHtml(lData25.label), '</a></li>');
    }
    output.append('</ul>');
  }
  output.append('</div><div class="refs-content">');
  var cList43 = opt_data.contents;
  var cListLen43 = cList43.length;
  for (var cIndex43 = 0; cIndex43 < cListLen43; cIndex43++) {
    var cData43 = cList43[cIndex43];
    output.append('<div id="', cData43.id, '" class="', (cIndex43 == 0) ? 'active' : '', '">', soy.$$escapeHtml(cData43.contents), '</div>');
  }
  output.append('</div></div><div class="preview toolbox"><div class="headers"><div class="head begin"><span>', soy.$$escapeHtml(opt_data.markup), '</span></div><div class="head"><span>Output</span></div></div>');
  var pList58 = opt_data.previewes;
  var pListLen58 = pList58.length;
  for (var pIndex58 = 0; pIndex58 < pListLen58; pIndex58++) {
    var pData58 = pList58[pIndex58];
    output.append('<div id="', pData58.id, '" class="codes ', (pIndex58 == 0) ? 'active' : '', '"><div class="code begin"><pre>', soy.$$escapeHtml(pData58.source), '</pre></div><div class="code"><pre>', soy.$$escapeHtml(pData58.output), '</pre></div></div>');
  }
  output.append('</div>');
  return opt_sb ? '' : output.toString();
};
