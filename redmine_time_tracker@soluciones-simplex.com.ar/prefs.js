const Gtk = imports.gi.Gtk;

const N_ = function(e) { return e; };

const Me = imports.misc.extensionUtils.getCurrentExtension();
const convenience = Me.imports.convenience;

let settings;
let settings_bool;
let settings_font;

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.redmine_time_tracker';

function init() {
    settings = convenience.getSettings();
}

function setBehaviour(behaviour) {
    settings.set_string(SETTINGS_BEHAVIOUR_KEY, behaviour);
    settings.set_boolean(SETTINGS_FIRST_TIME_KEY, false);
}

function createStringSetting(setting,label) {
    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
    
    let setting_label = new Gtk.Label( { label: label, xalign: 0});

    let value = settings.get_string(setting);

    let entry = new Gtk.Entry({ hexpand: true, text: value });
    let button = new Gtk.Button({label: "Save"});
    button.connect("clicked", function() {
      settings.set_string(setting,entry.get_text());
    });

    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(entry);
    hbox.add(button);

    return hbox;
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
                              border_width: 10 });
    let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
                             margin: 20, margin_top:10 });

    
    vbox.add(createStringSetting('url','Redmine url'));
    vbox.add(createStringSetting('access-key','User access key'));
    
    frame.add(vbox);
    frame.show_all();
    return frame;
}