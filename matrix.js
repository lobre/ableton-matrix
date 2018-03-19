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

Live.LiveSet = function() {
    if (!Live.liveSet) {
        Live.liveSet = new LiveAPI("live_set");
    }
    return Live.liveSet;
};

Live.LiveSetView = function() {
    if (!Live.liveSetView) {
        Live.liveSetView = new LiveAPI("live_set view");
    }
    return Live.liveSetView;
};

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
        masterTrackId: Live.Parse(Live.LiveSet().get("master_track"), 1),
        returnTrackIds: Live.Parse(Live.LiveSet().get("return_tracks")),
        trackIds: Live.Parse(Live.LiveSet().get("tracks")),
        visibleTrackIds: Live.Parse(Live.LiveSet().get("visible_tracks")),
        selectedTrackId: Live.Parse(Live.LiveSetView().get("selected_track"), 1),
        sceneIds: Live.Parse(Live.LiveSet().get("scenes")),
        selectedSceneId: Live.Parse(Live.LiveSetView().get("selected_scene"), 1)
    };
};

Live.GetAllTrackIds = function () {
    return Live.Env().trackIds.concat(Live.Env().returnTrackIds, Live.Env().masterTrackId);
};

Live.GetSelectedTrackIndex = function () {
    if (Live.Env().selectedTrackId) {
        for (var i = 0; i < Live.Env().visibleTrackIds.length; i++) {
            if (Live.Env().visibleTrackIds[i] == Live.Env().selectedTrackId) {
                return i;
            }
        }
    }
    return -1;
};

Live.GetVisibleTrackCount = function () {
    return Live.Env().visibleTrackIds.length;
};

Live.SelectMasterTrack = function () {
    Live.LiveSetView().set("selected_track", "id", Live.Env().masterTrackId);
};

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
};

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
};

Live.SetSelectedTrackIndex = function (index) {
    var visibleTrackCount = Live.GetVisibleTrackCount();
    if (index >= 0 && index < visibleTrackCount) {
        Live.LiveSetView().set("selected_track", "id", Live.Env().visibleTrackIds[index]);
    }
};

Live.FireSelectedScene = function() {
    var selectedSceneIndex = Live.GetSelectedSceneIndex();
    var selectedScene = new LiveAPI("live_set scenes " + selectedSceneIndex);
    selectedScene.call("fire_as_selected");
};

Live.StopAllClips = function() {
    Live.LiveSet().call("stop_all_clips");
};

Live.GetSceneCount = function() {
    return Live.Env().sceneIds.length;
};

Live.GetSelectedSceneIndex = function() {
    if (Live.Env().selectedSceneId) {
        for (var i = 0; i < Live.Env().sceneIds.length; i++) {
            if (Live.Env().sceneIds[i] == Live.Env().selectedSceneId) {
                return i;
            }
        }
    }
    return -1;
};

Live.SelectNextScene = function() {
    var sceneCount = Live.GetSceneCount();
    var selectedSceneIndex = Live.GetSelectedSceneIndex();

    if (sceneCount > 0) {
        if (selectedSceneIndex >= 0 && selectedSceneIndex < sceneCount - 1) {
            Live.SetSelectedSceneIndex(selectedSceneIndex + 1);
        } else {
            Live.SetSelectedSceneIndex(0);
        }
    }
};

Live.SelectPreviousScene = function() {
    var sceneCount = Live.GetSceneCount();
    var selectedSceneIndex = Live.GetSelectedSceneIndex();

    if (sceneCount > 0) {
        if (selectedSceneIndex > 0 && selectedSceneIndex < sceneCount) {
            Live.SetSelectedSceneIndex(selectedSceneIndex - 1);
        } else {
            Live.SetSelectedSceneIndex(sceneCount - 1);
        }
    }
};

Live.SetSelectedSceneIndex = function(index) {
    var sceneCount = Live.GetSceneCount();
    if (index >= 0 && index < sceneCount) {
        Live.LiveSetView().set("selected_scene", "id", Live.Env().sceneIds[index]);
    }
};

Live.FireSelectedClip = function() {
    var selectedSceneIndex = Live.GetSelectedSceneIndex();
    var selectedTrackIndex = Live.GetSelectedTrackIndex();
    if (selectedTrackIndex < 0) {
        Live.FireSelectedScene();
    } else {
        var clip = new LiveAPI("live_set visible_tracks " + selectedTrackIndex + " clip_slots " + selectedSceneIndex);
        clip.call("fire");
    }    
};

Live.StopSelectedClip = function() {
    var selectedSceneIndex = Live.GetSelectedSceneIndex();
    var selectedTrackIndex = Live.GetSelectedTrackIndex();
    if (selectedTrackIndex < 0) {
        Live.StopAllClips();
    } else {
        var clip = new LiveAPI("live_set visible_tracks " + selectedTrackIndex + " clip_slots " + selectedSceneIndex);
        clip.call("stop");
    }    
};


//--------------------------------------------------------------------
// Main

clear();

function nextTrack() {
    Live.SelectNextTrack();
}

function previousTrack() {
    Live.SelectPreviousTrack();
}

function nextScene() {
    Live.SelectNextScene();
}

function previousScene() {
    Live.SelectPreviousScene();
}

function fire() {
    Live.FireSelectedClip();
}

function stop() {
    Live.StopSelectedClip();
}