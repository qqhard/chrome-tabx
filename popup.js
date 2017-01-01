var IS_START = 'isstart';
var IS_REMOVE = 'isremove';
var IS_MOVE = 'ismove';
var FALLOFF = 'falloff';
var ROUND = 'round';
var MAX_TAB = 'maxtab'
var THD_REMOVE = 'thdremove';
var INIT_WEIGHT = 'initweight';
var ADD_WEIGHT = 'addweight';
var TYPE_GET = 'GET';
var TYPE_SET = 'SET';
var PARAM = 'param';

function disableInputs(disabled) {
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].getAttribute('name') != IS_START) {
            inputs[i].disabled = disabled;
        }
    }
}


function queryAndRender() {
    var message = {
        type: TYPE_GET,
        name: PARAM
    };
    chrome.runtime.sendMessage(message, function (param) {
        if (!param[IS_START]) {
            disableInputs(true);
        }
        document.getElementById(IS_START).checked = param[IS_START];
        document.getElementById(IS_REMOVE).checked = param[IS_REMOVE];
        document.getElementById(IS_MOVE).checked = param[IS_MOVE];
        document.getElementById(MAX_TAB).value = parseInt(param[MAX_TAB]);
        document.getElementById(FALLOFF).value = parseInt(param[FALLOFF] * 100);
        document.getElementById(ROUND).value = param[ROUND];
        document.getElementById(INIT_WEIGHT).value = param[INIT_WEIGHT];
        document.getElementById(ADD_WEIGHT).value = param[ADD_WEIGHT];
    });
}

queryAndRender();

function changeParam(name, value, fun) {
    var message = {
        type: TYPE_SET,
        name: name,
        value: value
    };
    if (!!fun) {
        chrome.runtime.sendMessage(message, fun);
    } else {
        chrome.runtime.sendMessage(message);
    }

}

document.getElementById(IS_START).onchange = function (event) {
    var value = event.target.checked;
    changeParam(IS_START, value, function () {
        disableInputs(!value);
    });
}

document.getElementById(IS_REMOVE).onchange = function (event) {
    var value = event.target.checked;
    changeParam(IS_REMOVE, value);
}

document.getElementById(IS_MOVE).onchange = function (event) {
    var value = event.target.checked;
    changeParam(IS_MOVE, value);
}

document.getElementById(MAX_TAB).onchange = function (event) {
    var value = event.target.value;
    if (!!value) {
        changeParam(MAX_TAB, parseInt(value));
    }
}

document.getElementById(FALLOFF).onchange = function (event) {
    var value = event.target.value;
    if (!!value) {
        changeParam(FALLOFF, parseFloat(value) / 100.0);
    }
}

document.getElementById(ROUND).onchange = function (event) {
    var value = event.target.value;
    if (!!value) {
        changeParam(ROUND, parseInt(value));
    }
}


document.getElementById(INIT_WEIGHT).onchange = function (event) {
    var value = event.target.value;
    if (!!value) {
        changeParam(INIT_WEIGHT, parseInt(value));
    }
}

document.getElementById(ADD_WEIGHT).onchange = function (event) {
    var value = event.target.value;
    if (!!value) {
        changeParam(ADD_WEIGHT, parseInt(value));
    }
}

document.getElementById("form").onkeydown = function (event) {
    event.preventDefault();
}
