# GoogleCalendarToSchoology
This repo contains functions related to syncing Google Calendars with Schoology calendars.

To begin, copy and paste the .gs file contents into a new Google Apps Script file. 

This code contains 2 main functions to help sync calendars from Google to Schoology (but not in reverse!). 

     syncGoogleCalendarToSchoologyCalendar does exactly what the name implies.
     
     UNsyncGoogleCalendarToSchoologyCalendar does exactly what the name implies.

The functions do NOT set up triggers to keep the calendars in sync, but this is very easy to accomplish! Simply go to the "Resourses" menu at the top of the Google Apps Script window, select "Current Project's Triggers" and set up a time-based trigger for syncGoogleCalendarToSchoologyCalendar to run.

If you want to uninstall the sync, simply delete the triggers you have for that sync and run UNsyncGoogleCalendarToSchoologyCalendar ONCE.

In order to sync multiple calendars, you need to copy and paste syncGoogleCalendarToSchoologyCalendar and UNsyncGoogleCalendarToSchoologyCalendar, rename them, update the parameters appropriately and create more triggers.

NOTE: syncGoogleCalendarToSchoologyCalendar only syncs future events. If changes are made to past events, they will not be synced to Schoology.
