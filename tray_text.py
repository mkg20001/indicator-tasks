#! /bin/sh
""":"
exec python $0 ${1+"$@"}
"""

import sys
import urllib
import json
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, GLib

PING_FREQUENCY_IN_SECONDS = 2
APPIND_SUPPORT = 1

class TasksIndicatorLabel:

    def __init__(self):
        global APPIND_SUPPORT
        try:
            from gi.repository import AppIndicator3 as appIndicator
        except:
            APPIND_SUPPORT = 0

        self.menu_setup()

        if APPIND_SUPPORT == 1:
            self.indicator = appIndicator.Indicator.new(
                "indicator-tasks", "indicator-tasks", appIndicator.IndicatorCategory.OTHER)
            self.indicator.set_status(appIndicator.IndicatorStatus.ACTIVE)
            self.indicator.set_menu(self.menu)
        else:
            self.indicator = Gtk.StatusIcon()
            self.indicator.set_from_file('ico.png')
            self.indicator.connect('popup-menu', self.onPopupMenu)

    def onPopupMenu(self, icon, button, time):
        self.menu.popup(None, None, Gtk.StatusIcon.position_menu, icon, button, time)

    def menu_setup(self):
        self.menu = Gtk.Menu()
        self.quit_item = Gtk.MenuItem("Quit")
        self.quit_item.connect("activate", self.quit)
        self.quit_item.show()
        self.menu.append(self.quit_item)

    def main(self):
        self.update_label()
        GLib.timeout_add_seconds(PING_FREQUENCY_IN_SECONDS, self.update_label)
        Gtk.main()

    def quit(self, widget):
        sys.exit(0)

    def update_label(self):
        global APPIND_SUPPORT

        f = open("label.txt","r")
        label=f.read()
        if APPIND_SUPPORT == 1:
            self.indicator.set_label(label,label)
        else:
            self.indicator.set_title(label)
        f.close()
        return True

if __name__ == "__main__":
    indicator = TasksIndicatorLabel()
    indicator.main()
