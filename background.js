var IS_START = 'isstart';
var IS_REMOVE = 'isremove';
var FALLOFF = 'falloff';
var THD_REMOVE = 'thdremove';
var ROUND = 'round';
var INIT_WEIGHT = 'initweight';
var ADD_WEIGHT = 'addweight';
var TYPE_GET = 'GET';
var TYPE_SET = 'SET';
var TYPE_ADD = 'ADD';

var urlInfo = [];
var tabToUrl = [];
var param = {
    isstart: true,
    isremove: true,
    falloff: 0.9,
    thdremove: 0.1,
    round: 10,
    initweight: 2,
    addweight: 2
};

function getUrlWeight(url) {
    var info = urlInfo[url];
    if(!!info){
        return info.weight;
    }
    return 0;
}

function setUrlWeight(url,weight) {
    var info = urlInfo[url];
    if(!!info) info.weight = weight;
    else urlInfo[url] = {weight:weight};
}

function initParams() {
    function initParam(name) {
        chrome.storage.local.get(name,function (value) {
            if(!!value[name]){
                param[name] = value[name];
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


function getDomain(url) {
    var re = /.*\/\/(.*?)\//;
    return re.exec(url+"/")[1];
}

function getUrl(url) {
    var re = /(.*?)#/;
    return re.exec(url+"#")[1];
}

function isBlankUrl(url) {
    if(!url || url.indexOf("chrome://")>=0) return true;
    return false;
}

function addWeight(url) {
    url = getUrl(url);
    var info = urlInfo[url];
    if(!!info && !!info.weight) setUrlWeight(url, info.weight + param[ADD_WEIGHT]);
    else setUrlWeight(url, param[INIT_WEIGHT]);
    console.log(url+' change weight to '+urlInfo[url].weight);
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

function adjustTabs(tabs) {
    var arrs = [];
    var domainScore = [];
    for(var i in tabs){
        var tab = tabs[i];
        if(isBlankUrl(tab.url))continue;
        var node = {
            oldIndex: tab.index,
            tabId: tab.id,
            url: getUrl(tab.url),
            domain: getDomain(tab.url),
            weight: getUrlWeight(tab.url),
        };
        if(!domainScore[node.domain]) domainScore[node.domain] = {count:1,weight:node.weight};
        else{
            var ds = domainScore[node.domain];
            ds.weight += node.weight;
            ds.count += 1;
        }
        arrs.push(node);
    }
    for(var i in arrs){
        var ds = domainScore[arrs[i].domain];
        arrs[i].domainScore = ds.weight / ds.count;
    }
    arrs.sort(function (a,b) {
        if(a.domain == b.domain){
            if(Math.abs(a.weight - b.weight) < 1e-6 )return a.oldIndex - b.oldIndex;
            return b.weight - a.weight;
        }
        if(Math.abs(a.domainScore - b.domainScore) < 1e-6)return cmpstr(a.domain,b.domain);
        return b.domainScore - a.domainScore;
    })
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
    if(!param[IS_START]){
        setTimeout(mainLoop,param[ROUND]*1000);
        return ;
    }
    for(var url in urlInfo){
        var weight = getUrlWeight(url);
        setUrlWeight(url,getUrlWeight(url) * param[FALLOFF]);
    }

    var tabsForDel = [];
    for(var tabId in tabToUrl){
        var url = tabToUrl[tabId];
        var weight = getUrlWeight(url);
        if(weight < param[THD_REMOVE]){
            delete urlInfo[url];
            delete tabToUrl[tabId];
            tabsForDel.push(parseInt(tabId));
        }
    }
    if(param[IS_REMOVE]){
        chrome.tabs.remove(tabsForDel);
    }

    setTimeout(function () {
        chrome.windows.getCurrent({populate:true},function (window) {
            adjustTabs(window.tabs);
            console.log("###")
            // console.log(window.tabs);
            console.log(urlInfo);
            console.log("###")
        });
    },1000);

    setTimeout(mainLoop,param[ROUND]*1000);
}


function startListeners() {
    chrome.tabs.onCreated.addListener(function(tab){
        console.log(tab);
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
        console.log('Tab '+tabId+' has been changed with these options:');
        console.log(changeInfo);
        var url = changeInfo.url;
        if(!!url){
            url = getUrl(url);
            var oldUrl = tabToUrl[tabId];
            var urlWeight = getUrlWeight(url);
            var oldWeight = getUrlWeight(oldUrl);
            if(!!urlWeight) {
                setUrlWeight(url,Math.max(param[INIT_WEIGHT],urlWeight));
            }else{
                if(!!oldWeight && getDomain(url) == getDomain(oldUrl)){
                    setUrlWeight(url,Math.max(param[INIT_WEIGHT], oldWeight));
                }else{
                    setUrlWeight(url,param[INIT_WEIGHT]);
                }
            }
            tabToUrl[tabId] = url;
        }
    });

    chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
        //console.log(moveInfo);
    });

    chrome.tabs.onActivated.addListener(function(activeInfo){
        console.log('Tab '+activeInfo.tabId+' in window '+activeInfo.windowId+' is active now.');
    });

    chrome.runtime.onMessage.addListener(function (message,sender,sendResponse) {
        switch(message.type)
        {
            case TYPE_ADD:
                addWeight(sender.tab.url);
                break;
            case TYPE_GET:
                sendResponse(param);
                break;
            case TYPE_SET:
                var name = message.name;
                var value = message.value;
                var save = {};
                save[name] = value;
                param[name] = value;
                chrome.storage.local.set(save);
                break;
            default:
                console.log('exception message:'+str(message));
        }

    });
}

(function () {
    initParams();
    startListeners();
    mainLoop();
})();