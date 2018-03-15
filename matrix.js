//--------------------------------------------------------------------
// Utils

function log() {
    for (var i = 0, len = arguments.length; i < len; i++) {
        var message = arguments[i];
        if (message && message.toString) {
            var s = message.toString();
            if (s.indexOf("[object ") >= 0) {
                s = JSON.stringify(message);
            }
            post(s);
        }
        else if (message === null) {
            post("<null>");
        }
        else {
            post(message);
        }
    }
    post("\n");
}

function clear() {
    log("___________________________________________________");
    log("Reload:", new Date);
}

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

//--------------------------------------------------------------------
// Live

var Live = new Object();

Live.liveSet = new LiveAPI("live_set");
Live.liveSetView = new LiveAPI("live_set view");

Live.Log = function (liveObject) {
    log("         PATH:", liveObject.path);
    log("               ID:", liveObject.id);
    log("CHILDREN:", liveObject.children);
};

Live.Parse = function (data, unique) {
    var parsed = removeFromArray(toArray(data), "id");
    if (unique && parsed.length == 1) {
        parsed = parsed[0];
    }
    return parsed;
};

Live.Env = function () {
    return {
        masterTrack: Live.Parse(Live.liveSet.get("master_track"), 1),
        returnTracks: Live.Parse(Live.liveSet.get("return_tracks")),
        tracks: Live.Parse(Live.liveSet.get("tracks")),
        visibleTracks: Live.Parse(Live.liveSet.get("visible_tracks")),
        selectedTrack: Live.Parse(Live.liveSetView.get("selected_track"), 1)
    }
};

Live.GetAllTrackIds = function () {
    return Live.Env().tracks.concat(Live.Env().returnTracks, Live.Env().masterTrack);
}

Live.GetSelectedTrackIndex = function () {
    if (Live.Env().selectedTrack) {
        for (var i = 0; i < Live.Env().visibleTracks.length; i++) {
            if (Live.Env().visibleTracks[i] == Live.Env().selectedTrack) {
                return i;
            }
        }
    }
    return -1;
}

Live.GetVisibleTrackCount = function () {
    return Live.Env().visibleTracks.length;
}

Live.SelectMasterTrack = function () {
    Live.liveSetView.set("selected_track", "id", Live.Env().masterTrack);
}

Live.SelectNextTrack = function () {
    var visibleTrackCount = Live.GetVisibleTrackCount();
    var selectedTrackIndex = Live.GetSelectedTrackIndex();

    if (visibleTrackCount > 0) {
        if (selectedTrackIndex == visibleTrackCount - 1) {
            Live.SelectMasterTrack();
        } else if (selectedTrackIndex >= 0 && selectedTrackIndex < visibleTrackCount - 1) {
            Live.SetSelectedTrackIndex(selectedTrackIndex + 1);
        } else {
            Live.SetSelectedTrackIndex(0);
        }
    } else {
        Live.SelectMasterTrack();
    }
}

Live.SelectPreviousTrack = function () {
    var visibleTrackCount = Live.GetVisibleTrackCount();
    var selectedTrackIndex = Live.GetSelectedTrackIndex();

    if (visibleTrackCount > 0) {
        if (selectedTrackIndex == 0) {
            Live.SelectMasterTrack();
        } else if (selectedTrackIndex > 0 && selectedTrackIndex < visibleTrackCount) {
            Live.SetSelectedTrackIndex(selectedTrackIndex - 1);
        } else {
            Live.SetSelectedTrackIndex(visibleTrackCount - 1);
        }
    } else {
        Live.SelectMasterTrack();
    }
}

Live.SetSelectedTrackIndex = function (index) {
    var visibleTrackCount = Live.GetVisibleTrackCount();
    if (index >= 0 && index < visibleTrackCount) {
        Live.liveSetView.set("selected_track", "id", Live.Env().visibleTracks[index]);
    }
}


//--------------------------------------------------------------------
// Main

clear();

function nextTrack() {
    Live.SelectNextTrack();
}

function previousTrack() {
    Live.SelectPreviousTrack();
}
