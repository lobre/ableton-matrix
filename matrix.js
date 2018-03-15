function log() {
  for(var i=0,len=arguments.length; i<len; i++) {
    var message = arguments[i];
    if(message && message.toString) {
      var s = message.toString();
      if(s.indexOf("[object ") >= 0) {
        s = JSON.stringify(message);
      }
      post(s);
    }
    else if(message === null) {
      post("<null>");
    }
    else {
      post(message);
    }
  }
  post("\n");
}

function logApi(liveObject) {
    log("         PATH:", liveObject.path);
    log("               ID:", liveObject.id);
    log("CHILDREN:", liveObject.children);
}
 
log("___________________________________________________");
log("Reload:", new Date);

//--------------------------------------------------------------------
// Helper functions

function toArray(data) {
    var array = [];
    for (var i = 0; i < data.length; i++) {
        array.push(data[i]);
    }
    return array;
}

function removeFromArray(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function liveParse(data, unique) {
    var parsed = removeFromArray(toArray(data), "id");
    if (unique && parsed.length == 1) {
        parsed = parsed[0];
    }
    return parsed;
}


//--------------------------------------------------------------------
// Track class
 
function Track() {
    this.liveSet = new LiveAPI("live_set");
    this.liveSetView = new LiveAPI("live_set view");

    this.masterTrack = liveParse(this.liveSet.get("master_track"), 1);
    this.returnTracks = liveParse(this.liveSet.get("return_tracks"));
    this.tracks = liveParse(this.liveSet.get("tracks"));

    this.visibleTracks = liveParse(this.liveSet.get("visible_tracks"));
    this.selectedTrack = liveParse(this.liveSetView.get("selected_track"), 1);

}
  
Track.prototype.GetAllTrackIds = function() {
    return this.tracks.concat(this.returnTracks, this.masterTrack);    
}

Track.prototype.GetSelectedTrackIndex = function() {
    if (this.selectedTrack) {
        for (var i = 0; i < this.visibleTracks.length; i++) {
            if (this.visibleTracks[i] == this.selectedTrack) {
                return i;
            }
        }
    }
    return -1;
}

Track.prototype.GetVisibleTrackCount = function() {
    return this.visibleTracks.length;
}

Track.prototype.SelectMasterTrack = function() {
    this.liveSetView.set("selected_track", "id", this.masterTrack);
}

Track.prototype.SelectNextTrack = function() {
    var visibleTrackCount = this.GetVisibleTrackCount();
    var selectedTrackIndex = this.GetSelectedTrackIndex();

    if (visibleTrackCount > 0) {
        if (selectedTrackIndex == visibleTrackCount - 1) {
            this.SelectMasterTrack();
        } else if (selectedTrackIndex >= 0 && selectedTrackIndex < visibleTrackCount - 1) {
            this.SetSelectedTrackIndex(selectedTrackIndex + 1);
        } else {
            this.SetSelectedTrackIndex(0);
        }
    } else {
        this.SelectMasterTrack();
    }
}

Track.prototype.SelectPreviousTrack = function() {
    var visibleTrackCount = this.GetVisibleTrackCount();
    var selectedTrackIndex = this.GetSelectedTrackIndex();

    if (visibleTrackCount > 0) {
        if (selectedTrackIndex == 0) {
            this.SelectMasterTrack();
        } else if (selectedTrackIndex > 0 && selectedTrackIndex < visibleTrackCount) {
            this.SetSelectedTrackIndex(selectedTrackIndex - 1);
        } else {
            this.SetSelectedTrackIndex(visibleTrackCount - 1);
        }
    } else {
        this.SelectMasterTrack();
    }
}

Track.prototype.SetSelectedTrackIndex = function(index) {
    var visibleTrackCount = this.GetVisibleTrackCount();
    if (index >= 0 && index < visibleTrackCount) {
        this.liveSetView.set("selected_track", "id", this.visibleTracks[index]);
    }
}

//--------------------------------------------------------------------
// Main

function nextTrack() {
   var track = new Track();
   track.SelectNextTrack();
}

function previousTrack() {
    var track = new Track();
    track.SelectPreviousTrack();
}