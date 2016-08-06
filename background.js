var IS_START = 'isstart';
var IS_REMOVE = 'isremove';
var FALLOFF = 'falloff';
var THD_REMOVE = 'thdremove';
var ROUND = 'round';
var INIT_WEIGHT = 'initweight';
var ADD_WEIGHT = 'addweight';
var TYPE_GET = 'GET';
var TYPE_SET = 'SET';
var PARAM = 'param';

var urlInfo = [];
var param = {
    isstart: true,
    isremove: true,
    falloff: 0.9,
    thdremove: 0.1,
    round: 10,
    initweight: 2,
    addweight: 2
};

function initParams() {
    function initParam(name) {
        chrome.storage.local.get(name,function (value) {
            if(!!value[name]){
                param[name] = value[name];
                console.log(param);
            }
        });
    }
    initParam(IS_START);
    initParam(IS_REMOVE);
    initParam(FALLOFF);
    initParam(THD_REMOVE);
    initParam(ROUND);
    initParam(INIT_WEIGHT);
    initParam(ADD_WEIGHT);
};
initParams();

function getDomain(url) {
    var re = /.*\/\/(.*?)\//;
    return re.exec(url+"/")[1];
}

function getUrl(url) {
    var re = /(.*?)#/;
    return re.exec(url+"#")[1];
}

function addClick(url) {
    url = getUrl(url);
    var info = urlInfo[url];
    if(!!info && !!info.click)urlInfo[url].click = info.click + 1;
    else urlInfo[url] = {click:1};
}

function cmpstr(a,b) {
    var lena = a.length;
    var lenb = b.length;
    if(lena != lenb)return lena - lenb;
    else{
        for(var i=0;i<lena;i++){
            if(a[i]<b[i])return -1;
            else if(a[i]>b[i])return 1;
        }
    }
}

function updateAll(tabs) {
    console.log(param);
    var arrs = [];
    var domainScore = [];
    for(var i in tabs){
        var tab = tabs[i];
        if(tab.url.indexOf("chrome://")>=0)continue;
        var click = param[INIT_WEIGHT];
        var url = getUrl(tab.url);
        if(!urlInfo[url]) urlInfo[url] = {click:click};
        else click = urlInfo[url].click;
        var node = {
            oldIndex: tab.index,
            tabId: tab.id,
            url: url,
            domain: getDomain(tab.url),
            click: click ,
        };
        if(!domainScore[node.domain])domainScore[node.domain] = 0;
        domainScore[node.domain] += node.click;
        arrs.push(node);
    }
    for(var i in arrs){
        arrs[i].domainClick = domainScore[arrs[i].domain];
    }
    arrs.sort(function (a,b) {
        if(a.domain == b.domain){
            if(a.click == b.click)return a.oldIndex - b.oldIndex;
            return b.click - a.click;
        }
        if(a.domainClick == b.domainClick)return cmpstr(a.domain,b.domain);
        return b.domainClick - a.domainClick;
    });
    console.log(arrs);
    for(var i = 0;i < arrs.length;i++){
        var tab = arrs[i];
        if(tab.oldIndex != i){
            chrome.tabs.move(tab.tabId, {
                index: i
            });
        }
    }

}

function mainLoop() {
    for(var url in urlInfo){
        var info = urlInfo[url];
        var click = info.click;
        if(click < param[THD_REMOVE] && param[IS_REMOVE]){
            delete urlInfo[url];
            chrome.tabs.query({url:url},function (tabs) {
                var arrs = [];
                for(var i in tabs){
                    arrs.push(tabs[i].id);
                }
                chrome.tabs.remove(arrs);
            });
        }else{
            info.click = click * param[FALLOFF];
        }
    }

    setTimeout(function () {
        chrome.windows.getCurrent({populate:true},function (window) {
            updateAll(window.tabs);
            console.log("###")
            console.log(window.tabs);
            console.log(urlInfo);
            console.log("###")
        });
    },1000);

    setTimeout(mainLoop,param[ROUND]*1000);
}

mainLoop();

chrome.tabs.onCreated.addListener(function(tab){

});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    console.log('Tab '+tabId+' has been changed with these options:');
    if(!!changeInfo.url){
        addClick(changeInfo.url);
    }

});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
    console.log(moveInfo);
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    console.log('Tab '+activeInfo.tabId+' in window '+activeInfo.windowId+' is active now.');
    chrome.tabs.get(activeInfo.tabId,function (tab) {
        if(tab.url.indexOf("chrome://")>=0)return ;
        addClick(tab.url);
    });
});

chrome.runtime.onMessage.addListener(function (message,sender,sendResponse) {
    if(message.type == 'GET'){
        sendResponse(param);
    }else if(message.type == 'SET'){
        var name = message.name;
        var value = message.value;
        var save = {};
        save[name] = value;
        param[name] = value;
        console.log(param);
        chrome.storage.local.set(save);
    }

});