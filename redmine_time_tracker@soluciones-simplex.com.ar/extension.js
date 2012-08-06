const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const convenience = Me.imports.convenience;

const session = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(session, new Soup.ProxyResolverDefault());

function Url(path,data){
  this._init(path,data);
}

Url.prototype = {
  _init: function(path,data) {
    this._settings = convenience.getSettings();
    this._path = path;
    this._data = data;
  },
  
  toString: function() {
    let url = this._settings.get_string('url') + this._path + '?key=' + this._settings.get_string('access-key');
    let params = [];
    for(let param in this._data)
      params.push(param + "=" + this._data[param]);

    if(params.length > 0){
      url = url + '&' + params.join('&');
    }
    return url;
  }
  
}

function Issue(name,id) {
  this._init(name,id);
}

Issue.prototype = {
  __proto__: PopupMenu.PopupBaseMenuItem.prototype,

  _init: function(name,id) {
    PopupMenu.PopupBaseMenuItem.prototype._init.call(this);
    this._id = id;
    this._name = name;
    let title = ''
    if(id > 0){
      title = id + ' - ' + name.substring(0,40);
    }
    this.actor.add_style_class_name('status-chooser-status-item');
    this.label = new St.Label({ text: title });
    this.addActor(this.label);
  },
  
  start_work: function()
	{
    this._startTime = new Date();
	},
  
  stop_work: function()
	{
    let hours = Math.round((new Date().getTime() - this._startTime.getTime()) / (10*60*60)) / 100;
    this._createTimeEntry(hours);
  },
  
  _createTimeEntry: function(hours){
    let url = new Url('/time_entries.xml',{'time_entry[issue_id]': this._id, 'time_entry[hours]': hours, 'time_entry[activity_id]': '1' });
    let request = Soup.Message.new('POST',url.toString());
    session.queue_message(request, function() {
        
    });
  }
  
};



function TimeTracker()
{	
	this._init();
}

TimeTracker.prototype =
{
	__proto__: PanelMenu.Button.prototype,
	
	_init: function() 
  {			
		PanelMenu.Button.prototype._init.call(this, St.Align.START);
    
		let buttonIcon = new St.Icon({ icon_name: 'document-open-recent',
                             icon_type: St.IconType.SYMBOLIC,
                             style_class: 'system-status-icon' });
		this.actor.add_actor(buttonIcon);
			
		this._refresh();
	},
  
  _refresh: function()
	{    		
		let tasksMenu = this.menu;
		tasksMenu.removeAll();
    //Adding refresh button
    let refreshButton = new PopupMenu.PopupMenuItem("Refresh");
    refreshButton.connect('activate', Lang.bind(this, this._refresh));
    tasksMenu.addMenuItem(refreshButton);
    
    //Adding issues combo
    this._combo = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });
    this._combo.connect('active-item-changed', Lang.bind(this, this._change_issue));
    tasksMenu.addMenuItem(this._combo);
    
    //Adding start button
    let startButton = new PopupMenu.PopupMenuItem("Start");
    startButton.connect('activate', Lang.bind(this, this._start_work));
    tasksMenu.addMenuItem(startButton);
    
    this._issues = new Array();
    let url = new Url('/issues.json',{'assigned_to_id': 'me'});
    let request = Soup.Message.new('GET',url.toString());
    session.queue_message(request, Lang.bind(this,function() {
      let item = new Issue('',0);
      this._combo.addMenuItem(item,0);
      let json = request.response_body.data;
      let issues = JSON.parse(json)['issues'];
      for (let i = 0; i < issues.length; i ++){
        let issue = issues[i];
        let item = new Issue(issue['subject'],parseInt(issue['id']));
        this._combo.addMenuItem(item,i + 1);
        this._issues[i + 1] = item;
      }
      this._combo.setActiveItem(0);
    }));
	},
  
  _change_issue: function(item)
  {
    this._currentIssue = this._issues[item._activeItemPos];
  },
  
  _start_work: function()
	{
    if(this._currentIssue._id == 0){
      return;
    }
		this._currentIssue.start_work();
    let tasksMenu = this.menu;
		tasksMenu.removeAll();
    tasksMenu.addMenuItem(new PopupMenu.PopupMenuItem("Working on #" + this._currentIssue._id));
    let item = new PopupMenu.PopupMenuItem("Stop");
    item.connect('activate', Lang.bind(this, this._stop_work));
    tasksMenu.addMenuItem(item);
	},
  
  _stop_work: function()
	{
    this._currentIssue.stop_work();
    this._refresh();
  },
  
	enable: function()
	{
		Main.panel._rightBox.insert_child_at_index(this.actor, 0);
		Main.panel._menus.addMenu(this.menu);
	},

	disable: function()
	{
		Main.panel._menus.removeMenu(this.menu);
		Main.panel._rightBox.remove_actor(this.actor);
	}
}


function init() {
  return new TimeTracker();
}