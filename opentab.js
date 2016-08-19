var TYPE_CLOSEURL = "CLOSEURL";
var OPEN = "open";

function getCloseUrl(){
	var message = {
		type: TYPE_CLOSEURL
	}
	chrome.runtime.sendMessage(message,function (closeUrl){
			var table = document.getElementById('opentabtable');
			for (var i=0;i<closeUrl.length;i++){
				//添加一行
				var row = table.insertRow();
				var cell = row.insertCell();
				cell.innerHTML = '<input type="checkbox">';
				cell = row.insertCell();
				cell.innerText = closeUrl[i];
			}
		}
	)
}
getCloseUrl()

document.getElementById(OPEN).onclick = function (event) {
	var tb = document.getElementById('opentabtable');
	if(tb.rows.length < 2){
		alert("no close html");
		return;
	}
	var row;
	var cell;
	var chk;
	for(var i=tb.rows.length-1;i>0;i--){
		row = tb.rows[i];
		cell = row.cells[0];
		chk = cell.getElementsByTagName("input")[0];
		if(chk.checked){
			window.open(row.cells[1].innerText);
		}
	}
}