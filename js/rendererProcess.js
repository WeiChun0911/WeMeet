const BrowserWindow = require('electron').remote;

const newWindowBtn = document.getElementById('new-window');

newWindowBtn.addEventListener('click', function(event) {
    let child = new BrowserWindow({ width: 400, height: 320 });
    child.on('close', function() { win = null });
    child.loadURL('http://localhost:8787/6666.html');
})
