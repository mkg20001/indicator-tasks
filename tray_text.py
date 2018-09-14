#! /bin/sh
""":"
exec python $0 ${1+"$@"}
"""

import sys
import urllib
import json
import gi
from gi.repository import Gtk, GLib
gi.require_version('Gtk', '3.0')
from gi.repository import AppIndicator3 as appIndicator

PING_FREQUENCY_IN_SECONDS = 2

class TasksIndicatorLabel:

    def __init__(self):
        self.indicator = appIndicator.Indicator.new(
            "indicator-tasks", "indicator-tasks", appIndicator.IndicatorCategory.OTHER)
        self.indicator.set_status(appIndicator.IndicatorStatus.ACTIVE)
        self.menu_setup()
        self.indicator.set_menu(self.menu)

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
        f = open("label.txt","r")
        label=f.read()
        self.indicator.set_label(label,label)
        f.close()
        return True

if __name__ == "__main__":
    indicator = TasksIndicatorLabel()
    indicator.main()
