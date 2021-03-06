/**
 * Created by hard on 16-8-5.
 */

function getNowTime() {
    return Date.parse(new Date())/1000;
}

var TYPE_ADD = 'ADD';
var ADD_ROUND = 10;
var MAX_ROUND = 100;
var lastOperateTime = getNowTime();
var lastAddTime = getNowTime();

function sendMessage(type) {
    var message = {
        type: type
    };
    chrome.runtime.sendMessage(message);
}

function updateTime() {
    var nowOperateTime = getNowTime();
    if(nowOperateTime - lastOperateTime < MAX_ROUND){
        if(nowOperateTime - lastAddTime > ADD_ROUND){
            sendMessage(TYPE_ADD);
            lastAddTime =  lastAddTime + ADD_ROUND;
        }
    }else{
        lastAddTime = nowOperateTime;
    }
    lastOperateTime = nowOperateTime;
}

document.onmousedown = function(event){
    updateTime();
};

document.onkeydown = function(event){
    updateTime();
};

window.onscroll = function() {
    updateTime();
}

