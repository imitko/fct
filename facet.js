/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Virtuoso Open-Source (VOS)
 *  project.
 *
 *  Copyright (C) 1998-2009 OpenLink Software
 *
 *  This project is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by the
 *  Free Software Foundation; only version 2 of the License, dated June 1991.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 *
 */

function link_change (prop)
{
  var a = $('map_link');
  if (a)
    a.href = a.href + '&location-prop=' + escape (prop);
}

function fct_nav_to (url)
{
  document.location = url;
}

var c_thr;

function fct_uri_ac_get_matches (ac_ctl)
{
    var val = ac_ctl.input.value;
    var parm_name;

    OAT.AJAX.abortAll();

    c_thr = $('new_uri_txt');

    OAT.AJAX.GET("/services/rdf/iriautocomplete.get?uri" + "=" + escape (val), 
                 false, 
                 fct_uri_ac_ajax_handler,{});
}

function fct_lbl_ac_get_matches (ac_ctl)
{
    var val = ac_ctl.input.value;
    var parm_name;

    OAT.AJAX.abortAll();

    c_thr = $('new_lbl_txt');

    OAT.AJAX.GET("/services/rdf/iriautocomplete.get?lbl" + "=" + escape (val), 
                 false, 
                 fct_lbl_ac_ajax_handler,{});
}


function fct_uri_ac_ajax_handler (resp)
{
    ac_hide_thr ();

    uri_ac.clear_opts();

    var resp_obj = OAT.JSON.parse (resp);

    if (resp_obj.results.length == 0)
	{
	    uri_ac.hide_popup ();
	    return;
	}

      if (resp_obj.restype == "single")
	uri_ac.set_uri_opts (resp_obj.results);
      else 
	uri_ac.set_uri_opts (resp_obj.results[0].concat(resp_obj.results[1]));

    uri_ac.show_popup ();
}

function fct_lbl_ac_ajax_handler (resp)
{
    ac_hide_thr ();

    lbl_ac.clear_opts();

    var resp_obj = OAT.JSON.parse (resp);

    if (resp_obj.results.length == 0)
	{
	    lbl_ac.hide_popup ();
	    return;
	}

      if (resp_obj.restype == "single")
	lbl_ac.set_opts (resp_obj.results);
      else 
	lbl_ac.set_opts (resp_obj.results[0].concat(resp_obj.results[1]));

    lbl_ac.show_popup ();
}

function ac_show_thr () 
{
  OAT.Dom.addClass (c_thr, 'thr');
}

function ac_hide_thr () 
{
  OAT.Dom.removeClass (c_thr, 'thr');
}


var lbl_ac; // XXX Global var ugly as sin OAT.AJAX really needs a way of passing arbitrary obj to callback
var uri_ac;

// an ugly resize handler overriding CSS size for result
//

function resize_handler ()
{
    var wp_width = OAT.Dom.getViewport ()[0];

    if ($('res')) 
      {
        var _w = (wp_width-230)+'px';
        $('res').style.width = _w;
      }
}

// Handle click in property values

function prop_val_click_h (e) {
}

function prop_a_compare_fun (a, b) {
    return b[1]-a[1];
}

numeric_s = {
    'http://www.w3.org/2001/XMLSchema#double': true,
    'http://www.w3.org/2001/XMLSchema#float': true,
    'http://www.w3.org/2001/XMLSchema#decimal': true,
    'http://www.w3.org/2001/XMLSchema#integer': true,
};

date_s = {
    'http://www.w3.org/2001/XMLSchema#date': true,
    'http://www.w3.org/2001/XMLSchema#dateTime': true,
};

g_dtp_s = {
    'http://www.w3.org/2001/XMLSchema#boolean':  0,
    'http://www.w3.org/2001/XMLSchema#string':   0,
    'http://www.w3.org/2001/XMLSchema#double':   0,
    'http://www.w3.org/2001/XMLSchema#float':    0,
    'http://www.w3.org/2001/XMLSchema#decimal':  0,
    'http://www.w3.org/2001/XMLSchema#integer':  0,
    'http://www.w3.org/2001/XMLSchema#date':     0,
    'http://www.w3.org/2001/XMLSchema#dateTime': 0,
};

function shorten_dt (dt_val) {
    var i = dt_val.indexOf('#')+1;
    if (i == -1 || i >= dt_val.length) return dt_val;
    return dt_val.substring(i);
}

function is_numeric_dt (dt) {
    return (dt in numeric_s);
}

function is_date_dt (dt) {
    return (dt in date_s);
}

// Not great but speedy enough for 20 or so items at a time
//
// Datatype selector with most frequent (on current page) first.
//

function prop_val_dt_sel_init () {
    var xsd_pfx = 'http://www.w3.org/2001/XMLSchema#';

    dt_s = g_dtp_s;

    var dv_v_a = $$('val_dt','result_t');

    var fnd = false;

    // Dear future me: I'm sorry.

    for (var i=0;i<dv_v_a.length;i++) {
	var v = dv_v_a[i].innerHTML;

	if (v in dt_s)
	    dt_s[v]++;
	else 
	    dt_s[v]=1;
    }

    var dt_a = [];

    for (i in dt_s) {
	dt_a.push ([i, dt_s[i]]);
    };

    dt_a.sort(prop_a_compare_fun);

    var opts_a=[];

    for (i=0;i<dt_a.length;i++) {
	opts_a.push(new Option(shorten_dt (dt_a[i][0]), dt_a[i][0], false));
    }

    var num_opt  = new Option ('Numeric', '##numeric', false);
    var none_opt = new Option ('No datatype', '##none', false);

    if (is_numeric_dt (dt_a[0][0])) {
	opts_a.unshift (num_opt);
	opts_a.push (none_opt);
    }
    else {
	opts_a.push (num_opt);
	opts_a.push (none_opt);
    }

    for (i=0;i<opts_a.length;i++)
	$('cond_dt').options[i] = opts_a[i];

    $('cond_dt').options[0].selected = true;

    OAT.Event.attach ('set_cond', 'click', function (e) {
	var ct = $v('cond_type');

	var v_l = $v('cond_lo');
	var v_h = $v('cond_hi');

	if (v_l == '') return;

	if ((ct == 'range' || ct == 'neg_range') && (v_h == '' || v_l == '')) return;


	if ($('cond_dt').value != '##numeric' && $('cond_dt').value != '##none' && ct != 'contains') {
	    v_h = '"' + v_h + '"^^<' + $v('cond_dt') + '>';
	    v_l = '"' + v_l + '"^^<' + $v('cond_dt') + '>';
	}

	if (ct == 'gt' || 
            ct == 'lt' || 
            ct == 'gte' || 
            ct == 'lte' || 
            ct == 'eq' || 
            ct == 'neq' || 
            ct == 'contains') {
	    $('out_hi').value = '';
	}

        if (ct == 'range' || ct == 'neg_range') {
          $("out_hi").value = v_h;
	  $("out_lo").value = v_l;
        } else 
          $("out_val").value = v_l;

        $('out_dtp').value = '';
        $('out_lang').value = '';
        
	$('cond_form').submit();
    });

    OAT.Dom.show ('cond_form');
}

In_ui = function (dom_ctr, form) {
    var self=this;

    this.data = [];
    this.form = $(form);
    this.dom_ctr = $(dom_ctr);

    this.show = function () {
      OAT.Dom.show (dom_ctr);
    }

    this.hide = function () {
      OAT.Dom.hide (dom_ctr);
    }

    this.find_val = function (_val, _dt, _lang) {
	for (var i = 0;i < self.data.length;i++) {
	    if (self.data[i].val  == _val &&
		self.data[i].dt   == _dt &&
		self.data[i].lang == _lang)
		return i;
	}
	return false;
    }

    this.add_val = function (_val, _dt, _lang) {

	if (false === self.find_val (_val, _dt, _lang))
	    self.data.append ({val: _val, dt: _dt, lang: _lang});

	self.refresh ();
    }

    this.del_val = function (i) {
	self.data.splice (i, 1);
        self.refresh();
    }

    this.val_add_h = function (e) {
	var _val  = self.new_val_i.value;
	var _dt   = self.new_dt_i.value;
        var _lang = self.new_lang_i.value;

	self.add_val (_val, _dt, _lang);
	OAT.Event.prevent(e);
    } 

    this.val_change_h = function (e) {

    }

    this.make_val_row = function (d, i) {
	var new_r = OAT.Dom.create ('tr');
        var new_val_col  = OAT.Dom.create ('td', {}, 'in_val');
	var new_dt_col   = OAT.Dom.create ('td', {}, 'in_dt');
        var new_lang_col = OAT.Dom.create ('td', {}, 'in_lang');
        var new_cmd_col  = OAT.Dom.create ('td', {}, 'in_cmd');

	new_val_col.innerHTML  = d.val;
	new_dt_col.innerHTML   = d.dt;
	new_lang_col.innerHTML = d.lang;	

        var del_a = OAT.Dom.create ('a', {}, 'in_del');
	del_a.innerHTML = 'Delete';

	OAT.Event.attach (del_a, 'click', function () {
	    self.del_val (i);
	});

	OAT.Dom.append ([new_cmd_col, del_a]);
	OAT.Dom.append ([new_r, new_val_col, new_dt_col, new_lang_col, new_cmd_col]);
        return new_r;
    } 

    this.sort_fun = function (a,b) {
	return (a.val > b.val);
    }

    this.sort = function () {
	self.data.sort (self.sort_fun);
    }

    this.refresh = function () {
	OAT.Dom.clear (self.val_list_tbody);

	self.sort ();

	for (var i=0;i < self.data.length;i++) {
            OAT.Dom.append ([self.val_list_tbody, self.make_val_row (self.data[i],i)]);
	}
	if (self.data.length) 
	    OAT.Dom.show(self.val_list_thead);
	else
	    OAT.Dom.hide(self.val_list_thead);
    }

    this.mk_attr = function (att_s, val) {
	var val_ck;
        if (typeof val == 'undefined') val_ck = '';
	else val_ck = val;
	return (att_s + '="' + val_ck + '"');
    }

    this.mk_cond_parm = function (d) {
	var elm = '<cond-parm ' +
	    self.mk_attr ('datatype', d.dt) + 
	    ' ' + 
	    self.mk_attr ('lang', d.lang) + '>';
	
	return (elm.concat(d.val,'</cond-parm>'));
    }

    this.submit = function (e) {
	OAT.Event.prevent(e);
	var val_s = '';
        if (!self.data.length) return;
        
        for (var i=0;i < self.data.length;i++) {
	    val_s = val_s.concat(self.mk_cond_parm (self.data[i]));
	}	    
	
        self.cond_parms.value = val_s;
        self.form.submit();
    }

    this.mk_manual_fm_row = function (e) {
	OAT.Event.prevent (e);
        self.manual_r      = OAT.Dom.create ('tr');
	self.new_val_c     = OAT.Dom.create ('td', {}, 'in_new_val_c');
        self.new_val_i     = OAT.Dom.create ('input');
	self.new_dt_c      = OAT.Dom.create ('td', {}, 'in_new_lang_c');
        self.new_dt_i      = OAT.Dom.create ('input');
	self.new_lang_c    = OAT.Dom.create ('td', {}, 'in_new_lang_c');
        self.new_lang_i    = OAT.Dom.create ('input');
        self.new_val_add_c = OAT.Dom.create ('td', {}, 'in_new_val_add_c');

        self.new_add_btn           = OAT.Dom.create ('button', {}, 'in_new_add_b');
        self.new_add_btn.innerHTML = "Add value"

	OAT.Dom.append ([self.new_val_c, self.new_val_i]);
	OAT.Dom.append ([self.new_dt_c, self.new_dt_i]);
	OAT.Dom.append ([self.new_lang_c, self.new_lang_i]);
	OAT.Dom.append ([self.manual_r, new_val_c, new_dt_c, new_lang_c]);
	OAT.Dom.append ([self.val_list_tbody, self.manual_r]);

 	OAT.Event.attach (self.new_add_btn, 'click', self.val_add_h);
    }

    this.init = function () {
        self.val_list_t     = OAT.Dom.create ('table', {}, 'val_list_ctr');

	self.val_list_thead = OAT.Dom.create ('thead', {}, 'val_list_head');
	self.val_list_thead.innerHTML = '<tr><th>Value</th><th>Datatype</th><th>Language</th></tr>';

	self.val_list_tbody = OAT.Dom.create ('tbody', {}, 'val_list_body');

	self.new_val_ctr         = OAT.Dom.create ('div', {}, 'new_val_ctr');

	self.new_val_l           = OAT.Dom.create ('label');
        self.new_val_l.innerHTML = "Value:";
        self.new_val_i           = OAT.Dom.create ('input');

	self.new_dt_l           = OAT.Dom.create ('label');
        self.new_dt_l.innerHTML = "Datatype:";
        self.new_dt_i           = OAT.Dom.create ('input');

	self.new_lang_l           = OAT.Dom.create ('label');
        self.new_lang_l.innerHTML = "Language:";
        self.new_lang_i           = OAT.Dom.create ('input');

        self.new_add_btn           = OAT.Dom.create ('button', {}, 'in_new_add_b');
        self.new_add_btn.innerHTML = "Add value"

	self.set_cond_btn = OAT.Dom.create ('button', {}, 'in_set_cond_b');
        self.set_cond_btn.innerHTML = "Set IN Condition"

 	self.cond_parms            = $('cond_parms');

 	OAT.Event.attach (self.new_add_btn, 'click', self.val_add_h);
 	OAT.Event.attach (self.set_cond_btn, 'click', self.submit);

        OAT.Dom.append ([self.new_val_ctr, 
			 self.new_val_l, self.new_val_i, 
			 self.new_dt_l, self.new_dt_i, 
			 self.new_lang_l, self.new_lang_i,
                         self.new_add_btn]);

        OAT.Dom.append ([self.val_list_t, 
			 self.val_list_thead, 
			 self.val_list_tbody]);

        OAT.Dom.append ([self.dom_ctr, 
			 self.val_list_t, 
			 self.new_val_ctr, 
			 self.set_cond_btn]);

	OAT.Dom.hide (self.val_list_thead);

	self.refresh();
    }

    this.init ();
}

function handle_val_anchor_click (e) {
    var iri = e.target.href.split('?')[1].match(/&iri=(.*)/);
    var val = e.target.href.split('?')[1].match(/&val=(.*)/);

    if (val)
	val = val[1].split('&')[0];
    else if (iri)
	val = iri[1].split('&')[0];

    val = decodeURIComponent (val)

    var dtp = decodeURIComponent(e.target.href.split('?')[1].match(/&datatype=(.*)/)[1].split('&')[0]);
    var lang = e.target.href.split('?')[1].match(/&lang=(.*)/)[1].split('&')[0];

    switch($('cond_type').value) {
    case "cond_none":
	return;
    case "lt":
    case "gt":
    case "lte":
    case "gte":
    case "eq":
    case "neq":
    case "contains":
        OAT.Event.prevent(e);
	$('cond_lo').value = val;
	break;
    case "range":
    case "neg_range":
        OAT.Event.prevent(e);
	if ($v('cond_lo') != '')
	    $('cond_hi').value = val;
	else 
	    $('cond_lo').value = val;
	break;
    case "in":
	OAT.Event.prevent(e);
        in_ui.add_val (val, dtp, lang);
        break;
    }
    $('out_dtp').value = dtp;
    $('out_lang').value = lang;
}

function prop_val_anchors_init () {
    var val_a = $$('sel_val','result_t');

    for (var i=0;i<val_a.length;i++) {
	OAT.Event.attach (val_a[i],'click', handle_val_anchor_click);
    }
}

function prop_cond_sel_init () {
    return;
}

var in_ui;

function init()
{
    resize_handler ();
    OAT.Event.attach (window, 'resize', resize_handler);

    if ($('main_srch')) {
	uri_ac = new OAT.Autocomplete('new_uri_txt',
			              'new_uri_val',
                                      'new_uri_btn', 
                                      'new_uri_fm', 
                                      {get_ac_matches: fct_uri_ac_get_matches});

	lbl_ac = new OAT.Autocomplete('new_lbl_txt',
				      'new_lbl_val',
				      'new_lbl_btn',
				      'new_lbl_fm',
                                      {get_ac_matches: fct_lbl_ac_get_matches});
				  

	var tabs = new OAT.Tab ('TAB_CTR', {dockMode: false});

	tabs.add ('TAB_TXT', 'TAB_PAGE_TXT');
	tabs.add ('TAB_URI', 'TAB_PAGE_URI');
	tabs.add ('TAB_URILBL', 'TAB_PAGE_URILBL');
	
	tabs.go (0);

	OAT.MSG.attach ('*', 'AJAX_START', function () { ac_show_thr () });

	OAT.Dom.show ('main_srch');
	
        if ((typeof window.external =="object") && 
            ((typeof window.external.AddSearchProvider == "unknown") || 
             (typeof window.external.AddSearchProvider == "function"))) 
          {
              OAT.Event.attach ('opensearch_link', 
                                'click', 
                                function () { window.external.AddSearchProvider(location.protocol+'//'+location.host+'/fct/opensearchdescription.vsp'); });
          }
    }
    if ($('fct_ft')) {
        var ct = $('fct_ft_fm');
	OAT.Anchor.assign ('fct_ft', {content: ct});
    }

    //
    // values list mode - enable UI for adding conds
    //

    if ($$('list', 'result_t').length > 0) {
	in_ui = new In_ui ('in_ctr','cond_form');

	prop_val_dt_sel_init();
	prop_val_anchors_init();
        prop_cond_sel_init();

	OAT.Dom.hide('cond_hi_ctr');

	OAT.Event.attach('cond_type', 'change', function (e) {
	    switch ($v(this)) {
	    case "none":
                in_ui.hide ();
		OAT.Dom.hide ('cond_inp_ctr');
		break;
	    case "lt":
            case "lte":
            case "gt":
            case "gte":
            case "eq":
            case "neq":
            case "contains":
                in_ui.hide ();
		OAT.Dom.show ('cond_inp_ctr');
		OAT.Dom.hide ('cond_hi_ctr');
		break;
	    case "range":
            case "neg_range":
                in_ui.hide();
		OAT.Dom.show ('cond_inp_ctr');
		OAT.Dom.show ('cond_hi_ctr');
		break;
            case "in":
                OAT.Dom.hide ('cond_inp_ctr');
                OAT.Dom.hide ('cond_hi_ctr');
                in_ui.show();
	    }
        });
    }
}

// opts = { loader: function  - function gets called when user hits tab or stops entering text
//          timer_interval: timer interval in msec };
//
// XXX (ghard) move to, and finish integration with, OAT
//

OAT.Autocomplete = function (_input, _value_input, _button, _form, optObj) {
    var self = this;
    
    this.timer = 0;
    this.value = 0;

    this.options = {
	name:"autocomplete", /* name of input element */
	timer_interval:1000,
	onchange:function() {}
    }
	
    for (var p in optObj) { self.options[p] = optObj[p]; }
    
    this.div = OAT.Dom.create("div", {}, "autocomplete");
    
    this.list = OAT.Dom.create("div",
			       {position:"absolute",left:"0px",top:"0px",zIndex:1001},
			       "autocomplete_list");
    
    self.instant = new OAT.Instant (self.list);
    
    this.submit_form = function() {
	if (self.value) {
	    self.val_inp.value = self.value;
	    self.frm.submit();
	}
	else return 0;
    }

    this.timer_handler = function (e)
    {
	self.value = 0;
	self.options.get_ac_matches(self);
	ac_timer = 0;
    }

    this.key_handler = function (e)
    {
	if (self.timer)
	    window.clearTimeout (self.timer);

	self.val_inp.value = '';

	self.timer = window.setTimeout (self.timer_handler, self.options.timer_interval);
	self.value = self.input.value;

    }

    this.keydown_handler = function (e)
    {
	if ((e.keyCode && e.keyCode == 13) || 
            (e.which && e.which == 13)) {
	    self.val_inp.value = '';
	    if (self.timer)
		window.clearTimeout (self.timer);
	    if (!self.value) {
		self.value = self.input.value = self.list.firstChild.children[1].innerHTML;
		self.submit_form();
	    }
	}
    }

    this.blur_handler = function (e) 
    {
	if (self.timer) {
	    window.clearTimeout (self.timer);
	    self.timer = 0;
	}
    }

    this.btn_handler = function(e) 
    {
	self.submit_form();
    }

    
    this.clear_opts = function() 
    {
	OAT.Dom.clear(self.list);
    }
	
    this.add_option = function(name, value) 
    {
	var n = name;
	var v = name;

	if (value) { v = value; }

	var opt = OAT.Dom.create("div", {}, "ac_list_option");

	var opt_lbl = OAT.Dom.create ("span", {}, "opt_lbl");
        opt_lbl.innerHTML = n;

	var opt_iri = OAT.Dom.create ("span", {}, "opt_iri"); 
	opt_iri.innerHTML = v;

	opt.value = v;
        opt.name = n;

	this.attach(opt);
	OAT.Dom.append ([opt, opt_lbl, opt_iri]);
	self.list.appendChild(opt);
    }

    this.attach = function(option) 
    {
	var ref = function(event) {
	    self.value       = option.value;
	    self.input.value = option.name;

	    self.options.onchange(self);
	    self.instant.hide();
            self.input.focus();
	    self.submit_form();
	}
	OAT.Event.attach(option, "click", ref);
    }

    this.set_opts = function (opt_list)
    {	
	if (opt_list.length) {
	    for (var i=0;i<opt_list.length;i=i+2) {
		this.add_option(opt_list[i], opt_list[i+1]);
	    }
	    self.btn.disabled = false;
	}
	else
	    self.btn.disabled = true;
    }
	
    this.set_uri_opts = function (opt_list)
    {	
	if (opt_list.length) {
	    for (var i=0;i<opt_list.length;i=i+1) {
		this.add_option(opt_list[i]);
	    }
	    self.btn.disabled = false;
	}
	else
	    self.btn.disabled = true;
    }
	
    this.show_popup = function ()
    {
	self.instant.show();
    }

    this.hide_popup = function ()
    {
	self.instant.hide();
    }
	
    self.instant.options.showCallback = function() 
    {
	var coords = OAT.Dom.position(self.input);
	var dims = OAT.Dom.getWH(self.input);
	self.list.style.left  = (coords[0]+2) +"px";
	self.list.style.top   = (coords[1]+dims[1]+5)+"px";
        self.list.style.width = (dims[0]+"px");
    }

    this.input = $(_input);
    this.btn = $(_button);
    this.frm = $(_form);
    this.val_inp = $(_value_input);

    self.btn.disabled = true;

    OAT.Event.attach (this.input, 'keydown', this.keydown_handler);
    OAT.Event.attach (this.input, 'keyup',   this.key_handler);
    OAT.Event.attach (this.input, 'blur',    this.blur_handler);
    OAT.Event.attach (this.btn,   'click',   this.btn_handler);

    OAT.Dom.append([document.body,self.list]);
}

function fct_sel_neg (cb)
{
  var a = $('a_' + cb.value);
  if (0 == a.href.length)
    return;
  if (cb.checked == true)
    {
      var pos = a.href.lastIndexOf ('&exclude=yes');
      if (pos > 0)
	a.href.substring (0, pos);
    }
  else
    a.href = a.href + '&exclude=yes';
}

function fct_set_pivot_page_size()
{
  var pg_size = $('pivot_pg_size').value;
  pg_size = parseInt(pg_size);
  if (isNaN(pg_size) || pg_size < 0)
    pg_size = 0;
  else if (pg_size > 1000)
    pg_size = 1000;

  $('pivot_pg_size').value = pg_size.toString();

  var a = $('pivot_a_mpc');
  var href = a.href;
  href = href.replace(/limit=\d+/, 'limit='+pg_size);
  a.setAttribute("href", href);
}

function fct_set_pivot_qrcode_opt()
{
  var qrcode_flag = $('pivot_qrcode').checked ? 1 : 0;
  var a = $('pivot_a_mpc');
  var href = a.href;
  href = href.replace(/qrcodes=\d+/, 'qrcodes='+qrcode_flag);
  a.setAttribute("href", href);
}

function fct_set_pivot_subj_uri_opt()
{
  var opt = $('CXML_redir_for_subjs').value;
  var a = $('pivot_a_mpc');
  var href = a.href;
  href = href.replace(/CXML_redir_for_subjs=[^&]*&/, 'CXML_redir_for_subjs='+opt+'&');
  a.setAttribute("href", href);
}

function fct_set_pivot_href_opt()
{
  var opt = $('CXML_redir_for_hrefs').value;
  var a = $('pivot_a_mpc');
  var href = a.href;
  href = href.replace(/CXML_redir_for_hrefs=[^&]*&/, 'CXML_redir_for_hrefs='+opt+'&');
  a.setAttribute("href", href);
}
