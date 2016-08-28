var consumerKey = '(your key here)'; // Can be found at http://schoology.yourDomainName.whatever/api

var consumerSecret = '(your secret here)'; // Can be found at http://schoology.yourDomainName.whatever/api

var signatureMethod = 'PLAINTEXT'; // This is the signature generation method used for Oauth. For https connection, plaintext works fine. See https://developers.schoology.com/api-documentation/authentication for details. 

var baseUrl = 'https://api.schoology.com/v1/'; // API calls are made to urls which start this way.

var authVersion = '1.0'; // Current Oauth version used.

var requestDelay = 200; //in ms. 50 requests per 5 seconds is Schoology's api request limit, but 100 ms doesn't work consistently.


/* This is the main function you can replicate and set triggers for in order to sync Google calendars to a Schoology section calendar.
   This can easily be modified to sync to Districts, Schools, Users or Groups. (Though I have never done this so try it with a small calendar first!)
   NOTE: This only syncs future events. If changes are made to past events, they will not be synced.
*/
function syncGoogleCalendarToSchoologySectionCalendar(){
  
  //Choose schoologyCalendarType from district, school, user, section, or group as described here: https://developers.schoology.com/api-documentation/rest-api-v1/event
  
  var schoologyCalendarType = 'section';
  
/* This is easily found in the URL for the specific calendar you want to edit. 
  A District user can select the District in triangle menu in the upper right of the Schoology page. The url will look like http://schoology.someSchoolsDomain.net/school/ID.
  A specific school user can select the specific school in that same menu. The url will also look like http://schoology.someSchoolsDomain.net/school/ID.
  Any user can click Home, then Calendar on the left, and find their id in the Url: http://schoology.someSchoolsDomain.net/calendar/ID/...
  Clicking on a class section gives you the id in the Url also: http://schoology.minnehahaacademy.net/course/ID/...
  Same for groups...
*/
  var id = '(your district/school/section/user/group calendar id here)';
  
  // Name as it appears in your Google calendars list.
  var googleCalendarName = '(your calendar name here)';
  
  // How many FUTURE days of events to sync to Schoology.
  var daysToSync = 30;
  
  // First delete all synced events from googleCalendarName...
  deleteSyncedGoogleEventsFromSection(schoologyCalendarType, id, googleCalendarName)
  
  //... then post "refreshed" googleCalendarName events.
  postGoogleEventsToSchoologySection(schoologyCalendarType, id, googleCalendarName, daysToSync);
  
}


function UNsyncGoogleCalendarToSchoologySectionCalendar(){
  
  //Choose schoologyCalendarType from district, school, user, section, or group as described here: https://developers.schoology.com/api-documentation/rest-api-v1/event
  
  var schoologyCalendarType = 'section';
  
/* This is easily found in the URL for the specific calendar you want to edit. 
  A District user can select the District in triangle menu in the upper right of the Schoology page. The url will look like http://schoology.someSchoolsDomain.net/school/ID.
  A specific school user can select the specific school in that same menu. The url will also look like http://schoology.someSchoolsDomain.net/school/ID.
  Any user can click Home, then Calendar on the left, and find their id in the Url: http://schoology.someSchoolsDomain.net/calendar/ID/...
  Clicking on a class section gives you the id in the Url also: http://schoology.minnehahaacademy.net/course/ID/...
  Same for groups...
*/
  var id = '(your district/school/section/user/group calendar id here)';
  
  // Name as it appears in your Google calendars list.
  var googleCalendarName = '(your calendar name here)';
  
  // Delete all synced events from googleCalendarName...
  deleteSyncedGoogleEventsFromSection(schoologyCalendarType, id, googleCalendarName);

}


// This function grabs events from googleCalendarName and sends them to Schoology class id's calendar. Triggers can be set up to do this automatically.
function postGoogleEventsToSchoologySection(schoologyCalendarType, id, googleCalendarName, daysToSync){
  
  // Get a period of events from googleCalendarName
  var now = new Date();
 
  var later = new Date(now.getTime() + (daysToSync * 24 * 60 * 60 * 1000)); // "days" days of events in the future will be copied over.
  
  var googleEvents = CalendarApp.getCalendarsByName(googleCalendarName)[0].getEvents(now, later);
  
  // Create a Schoology event for each Google calendar event from the time period.
  for(var i = 0; i < googleEvents.length; i++){
   
    // If the Google event is an all-day event...
    if(googleEvents[i].isAllDayEvent()){
      
      // ... it must be handled differently...
      var title = googleEvents[i].getTitle();
      var description = googleEvents[i].getDescription() + '- Synced from Google Calendar ' + googleCalendarName;
      var start = formatDate(googleEvents[i].getAllDayStartDate());
      
      var endDate = googleEvents[i].getAllDayEndDate();
      endDate.setDate(endDate.getDate()-1);
      
      var end = formatDate(endDate); // For some reason, Schoology interprets every all-day event from Google to end 1 day later than they're supposed to.
      var isAllDayEvent = true;

      postGoogleEvent(title, description, start, end, isAllDayEvent, schoologyCalendarType, id);
      
    }
    
    // ...than if it's not an all day event.
    if(!googleEvents[i].isAllDayEvent()){
      
      var title = googleEvents[i].getTitle();
      var description = googleEvents[i].getDescription() + '- Synced from Google Calendar ' + googleCalendarName;
      var start = formatDate(googleEvents[i].getStartTime()) + " " + formatDateTime(googleEvents[i].getStartTime());
      var end = formatDate(googleEvents[i].getEndTime()) + " " + formatDateTime(googleEvents[i].getEndTime());
      var isAllDayEvent = false;
      
      postGoogleEvent(title, description, start, end, isAllDayEvent, schoologyCalendarType, id);
      
    }
    
  }
  
}



// This function grabs all Schoology section events which were synced from googleCalendarName and deletes them.
function deleteSyncedGoogleEventsFromSection(schoologyCalendarType, id, googleCalendarName){
  
  var d = new Date();
  var timestamp = d.getTime()/1000; // Get current time in seconds.
  var nonce = timestamp; // Schoology requires a unique nonce value for each timestamp. Could do something fancier.

  var apiUrl = schoologyCalendarType + 's/' + id + '/events/';
  
  var url = baseUrl + apiUrl + '?oauth_consumer_key=' + consumerKey + '&oauth_signature_method=' + signatureMethod + '&oauth_timestamp=' + timestamp + '&oauth_nonce=' + nonce + '&oauth_version=' + authVersion + '&oauth_signature=' + consumerSecret + '%26'; 
   
  Utilities.sleep(requestDelay); // Separate requests so that Schoology stays happy.
  var response = UrlFetchApp.fetch(url); // Make the api call and store the response from the server.
  var data = JSON.parse(response).event; // Grab the info we're really after.
  
  var syncedEvents = [];
  
  for(var i = 0; i < data.length; i++){
    
    if(data[i].description.indexOf('- Synced from Google Calendar ' + googleCalendarName) > -1){
      
      deleteSchoologyEvent(data[i].id, schoologyCalendarType, id, googleCalendarName);
      
    }
  } 
}


function postGoogleEvent(title, description, start, end, isAllDayEvent, schoologyCalendarType, id){ 
  
  var d = new Date();
  var timestamp = d.getTime()/1000; // Get current time in seconds.
  var nonce = timestamp; // Schoology requires a unique nonce value for each timestamp. Could do something fancier.

  var apiUrl = schoologyCalendarType + 's/' + id + '/events/';
  
  var schoologyEvent = {'title':title};
  schoologyEvent.description = description;
  schoologyEvent.start = start;
  schoologyEvent.has_end = 1;
  schoologyEvent.end = end;
  schoologyEvent.type = 'event';
  schoologyEvent.all_day = String(Number(isAllDayEvent));
  
  var payload = JSON.stringify(schoologyEvent);
  
  var options =
      {
        "method" : "post",
        "contentType" : "application/json",
        "payload" : payload
      };
  
  var url = baseUrl + apiUrl + '?oauth_consumer_key=' + consumerKey + '&oauth_signature_method=' + signatureMethod + '&oauth_timestamp=' + timestamp + '&oauth_nonce=' + nonce + '&oauth_version=' + authVersion + '&oauth_signature=' + consumerSecret + '%26'; 
   
  Utilities.sleep(requestDelay); // Delay requests so that Schoology stays happy.
  var response = UrlFetchApp.fetch(url, options); // Make the api call and store the response from the server.

}


function deleteSchoologyEvent(eventId, schoologyCalendarType, id, googleCalendarName){
  
  var d = new Date();
  var timestamp = d.getTime()/1000; // Get current time in seconds.
  var nonce = timestamp; // Schoology requires a unique nonce value for each timestamp. Could do something fancier.

  var apiUrl = schoologyCalendarType + 's/' + id + '/events/' + eventId;
  
  var options =
      {
        "method" : "delete"
      };
  
  var url = baseUrl + apiUrl + '?oauth_consumer_key=' + consumerKey + '&oauth_signature_method=' + signatureMethod + '&oauth_timestamp=' + timestamp + '&oauth_nonce=' + nonce + '&oauth_version=' + authVersion + '&oauth_signature=' + consumerSecret + '%26'; 
   
  Utilities.sleep(requestDelay); // Delay requests so that Schoology stays happy.
  var response = UrlFetchApp.fetch(url, options); // Make the api call and store the response from the server.
  
}



function formatDate(date){
 
  var yearString = date.getYear();
  
  var monthNumber = date.getMonth() + 1;
  var monthString = monthNumber.toString();
  
  var dayNumber = date.getDate();
  var dayString = dayNumber.toString();
  
  // Check month and day strings to make sure they are two characters.
  if(monthString.length == 1){
    
    monthString = "0" + monthString;
    
  }
  
  if(dayString.length == 1){
    
    dayString = "0" + dayString;
    
  }
  
  var date = yearString  + "-" + monthString + "-" + dayString;
  
  return(date);
}

function formatDateTime(dateTime){
 
  var hoursString = String(dateTime.getHours());
 
  var minutesString = String(dateTime.getMinutes());
  
  var secondsString = String(dateTime.getSeconds());
  
  // Check strings to make sure they are two characters.
  if(hoursString.length == 1){
    
    hoursString = "0" + hoursString;
    
  }
  
  if(minutesString.length == 1){
    
    minutesString = "0" + minutesString;
    
  }
  
  if(secondsString.length == 1){
    
    secondsString = "0" + secondsString;
    
  }
  
  var dateTime = hoursString  + ":" + minutesString + ":" + secondsString;
  
  return(dateTime);
}
