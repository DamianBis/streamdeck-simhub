//
//  main.js
//  Simhub Plugin
//
//  Created by Grahame Wright, Baptiewright Designs
//  Updated by Damian Bisignano https://github.com/DamianBis
//

let websocket = null;
let pluginUUID = null;
//let settingsCache = {};
let globalSettingsCache = {};
let settingsCache = {};
let flagContext = [];

const controlAction = {

    type: "com.damianbis.simhub.control",

    onKeyUp: function (context, settings, coordinates, userDesiredState) {
        triggerSimhub(settings['trigger'], context);
        updateTelemetryValues();
    },

    onWillAppear: function (context, settings, coordinates, action) {
        if (action == "com.damianbis.simhub.flag") {
            flagContext.push(context);
        }
        else {
            settingsCache[context] = { ...settings, action: action };
        }
    },

    SetTitle: function (context, jsonPayload) {
        //console.log(jsonPayload['title']);
        let payload = {};
        payload.title = jsonPayload['title'].toString();
        payload.target = "DestinationEnum.HARDWARE_AND_SOFTWARE";
        const json = {
            "event": "setTitle",
            "context": context,
            "payload": payload,
        };
        websocket.send(JSON.stringify(json));
    },

    setImage: function (context, image) {
        let payload = {}
        payload.image = image
        payload.target = "DestinationEnum.HARDWARE_AND_SOFTWARE";
        let json = {
            "event": "setImage",
            "context": context,
            "payload": payload,
        };
        websocket.send(JSON.stringify(json));
    },

    setState: function (context, state) {
        let json = {
            "event": "setState",
            "context": context,
            "payload": {
                "state": state
            }
        };
        websocket.send(JSON.stringify(json));
    }


};

function updateTelemetryValues() {
    let props = Object.getOwnPropertyNames(settingsCache);

    let simhubUrl = `http://localhost:8888/api/getgamedata`;
    let method = "GET";
    var request = new XMLHttpRequest();
    request.open(method, simhubUrl);

    request.send();
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var data = JSON.parse(request.responseText);

                for (var prop in props) {
                    let v = settingsCache[props[prop]];
                    let value = data.newData[v.telemetry];

                    if (typeof (value) === "number") {
                        value = +(value.toFixed(2))
                    }

                    if (v.action == "com.damianbis.simhub.control") {
                        controlAction.SetTitle(props[prop], { title: value || "" });
                    }
                    else {
                        if (value == v.enabled) {
                            controlAction.setState(props[prop], 1)
                        }
                        else {
                            controlAction.setState(props[prop], 0)
                        }

                    }
                }
                updateFlag(data.newData)
            }
        }
    }
}


function updateFlag(data) {
    if (flagContext.length == 0) { return }
    let image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:green\"></rect></svg>";

    if (data["flag_Black"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:black\"></rect></svg>";
    }
    else if (data["flag_Orange"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"100\" width=\"100\"><path d=\"M0,0H4V3H0\" fill=\"#000\"/><circle cx=\"50%\" cy=\"50%\" r=\"28.3%\" fill=\"#ff850d\"/></svg>";
    }
    else if (data["flag_Blue"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:blue\"></rect></svg>";
    }
    else if (data["flag_Checkered"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 5 5\"><rect width=\"5\" height=\"5\"/><path d=\"M0,0V5H1V0zM2,0V5H3V0zM4,0V5H5V0zM0,0H5V1H0zM0,2H5V3H0zM0,4H5V5H0z\" fill=\"#fff\" fill-rule=\"evenodd\"/></svg>";
    }
    else if (data["flag_Green"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:green\"></rect></svg>";
    }
    else if (data["flag_White"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:white\"></rect></svg>";
    }
    else if (data["flag_Yellow"] == 1) {
        image = "data:image/svg+xml;charset=utf8,<svg height=\"100\" width=\"100\"><rect height=\"100\" width=\"100\" style=\"fill:yellow\"></rect></svg>";
    }

    for (let context in flagContext) {
        controlAction.setImage(flagContext[context], image);
    }
}

function triggerSimhub(trigger, context) {
    var simURL = "http://localhost:8888/api/triggerinput/" + trigger;
    var method = "GET";
    var request = new XMLHttpRequest();
    request.open(method, simURL);
    request.send();
    //console.log(request);
    request.onreadystatechange = function () {

        if (request.readyState == 4) {
            if (request.status == 200) {
                //var status = request.status;
                var data = request.responseText;
                if (data == "Ok") {
                    showAlert("showOk", context);
                }
                else {
                    //console.log("Shit went wrong");
                    showAlert("showAlert", context);
                }

            }
            else {
                //console.log("Shit went wrong");
                showAlert("showAlert", context);
            }
        }
    }
}

function showAlert(event, context) {
    if (websocket) {
        let payload = {};
        const json = {
            "event": event,
            "context": context,
        };
        websocket.send(JSON.stringify(json));
    }
}

function requestSettings(uuid, event, payload = {}) {
    if (websocket) {
        const json = {
            "event": event,
            "context": uuid,
            "payload": payload,
        };
        //console.log("sending to plugin",json);
        websocket.send(JSON.stringify(json));
    }
}

function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
    pluginUUID = inPluginUUID;
    console.log("pluginUUID ", pluginUUID);
    // Open the web socket
    websocket = new WebSocket("ws://localhost:" + inPort);

    function registerPlugin(inPluginUUID) {
        const json = {
            "event": inRegisterEvent,
            "uuid": inPluginUUID
        };

        websocket.send(JSON.stringify(json));
    };

    websocket.onopen = function () {
        // WebSocket is connected, send message
        registerPlugin(pluginUUID);
        requestSettings(pluginUUID, "getGlobalSettings");
    };

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        const jsonObj = JSON.parse(evt.data);
        const event = jsonObj['event'];
        const action = jsonObj['action'];
        const context = jsonObj['context'];
        const jsonPayload = jsonObj['payload'];
        console.log("main plugin onmessage", jsonObj)
        if (event == "keyUp") {
            const settings = jsonPayload['settings'];
            const coordinates = jsonPayload['coordinates'];
            const userDesiredState = jsonPayload['userDesiredState'];
            controlAction.onKeyUp(context, settings, coordinates, userDesiredState);
        }
        else if (event == "willAppear") {
            const settings = jsonPayload['settings'];
            const coordinates = jsonPayload['coordinates'];
            controlAction.onWillAppear(context, settings, coordinates, action);
        }
        else if (event == "propertyInspectorDidAppear") {

        }
        else if (event == "didReceiveSettings") {
            settingsCache[context] = { ...jsonPayload.settings, action: action };
        }

        else if (event == "didReceiveGlobalSettings") {

        }
        else if (event == "sendToPlugin") {

        }


    }

    setInterval(function (sx) {
        updateTelemetryValues();
    }, 1000);

};
