//
//  main_pi.js
//  Simhub Plugin
//
//  Created by Grahame Wright, Baptiewright Designs
//
//

let websocket = null,
    uuid = null,
    actionInfo = {};
settingsCache = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inUUID;
    actionInfo = JSON.parse(inActionInfo);
    const action = actionInfo.action;
    settingsCache[uuid] = actionInfo.payload.settings;
    settings = settingsCache[uuid];
    //console.log(settingsCache[uuid]);
    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    websocket.onopen = function () {
        const json = {
            event: inRegisterEvent,
            uuid: uuid,
        };
        websocket.send(JSON.stringify(json));
        //requestSettings(uuid,"getGlobalSettings");
    };

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        console.log("event", evt);
        const jsonObj = JSON.parse(evt.data);
        settings = settingsCache[uuid];
        const payload = jsonObj.payload;
        if (jsonObj.event === 'didReceiveSettings') {
            settingsCache[uuid] = payload.settings;
            settings = settingsCache[uuid];
        }

        const el = document.querySelector('.sdpi-wrapper');
        el && el.classList.remove('hidden');
    };

    if (settings.trigger) {
        var trigger = document.getElementById('trigger');
        trigger.value = settings.trigger;
    }
    if (settings.telemetry) {
        var telemetry = document.getElementById('telemetry');
        telemetry.value = settings.telemetry;
    }

}

function updateSettings() {
    //console.log("Updating Local Settings");
    if (websocket) {
        let payload = {};
        const trigger = document.getElementById('trigger').value;
        const telemetry = document.getElementById('telemetry').value;
        payload.trigger = trigger;
        payload.telemetry = telemetry

        const json = {
            "event": "setSettings",
            "context": uuid,
            "payload": payload,
        };
        //console.log("Updating Local Settings",json);
        websocket.send(JSON.stringify(json));
        settingsCache[uuid] = payload;
    }
}




