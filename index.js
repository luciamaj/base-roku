function main(isInit) {
    const ioclient = require('socket.io-client');
    const http = require('http');

    const { executeCmd } = require(__dirname + '/modules/commands.js');
    const { config } = require(__dirname + '/config/config.js');

    let infoDebug = {"error-chromiumcrashed": null, "error-pageerror": null, "error-requestfailed": null, "console": []}
    var fileRead = false;
    var configSaved = {};
    
    let machineName = "brightsign";
    let centrale = ioclient(config.centrale);

    if(isInit) {
        var registryClass = require("@brightsign/registry");
        var registry = new registryClass();

        centrale.on('config', function (dataArr) {
            console.log(dataArr, `from central`);
            configSaved = dataArr;

            registry.write({"appdata": dataArr}).then( function(){
                console.log("Write Successful");
                openAppAndServer();
            });
        });

        centrale.on('connect_error', function() {
            console.log("CONNECTION ERROR");
            if(fileRead == false) {
                registry.read("appdata").then(function(registry){
                    console.log(JSON.stringify(registry));
                    configSaved = registry;
                    openAppAndServer();
                });
            }
        });
    } else {
        console.log("SONO SULLA PAGINA", configSaved.app);
    }

    centrale.on('cmd', function(cmd) {
        executeCmd(cmd);
    });

    function openAppAndServer() {
        let server = http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('Listening to port: ' + config.port);
            res.write('Config: ' + configSaved.app);
            res.end();
        });

        server.listen(config.port, function() {
            console.log("callback listen");        
        });

        console.log("APP DA APRIREEEEEEE", configSaved.app);

        location.href = __dirname + configSaved.app + "\\layout\\index.html";
    }

    function emitPeriferica() {
        var registryClass = require("@brightsign/registry");
        var registry = new registryClass();

        registry.read().then(function(registry) {
            let name = registry.networking.un;
            console.log("NAME", name);

            centrale.emit('periferica', {machineName: machineName, name: name, infoDebug: infoDebug});
        });
    }

    centrale.on('connect', function () {
        console.log(`connected to central`);
        emitPeriferica();
    });

    centrale.on('disconnect', function () {
        console.log(`disconnected from central`);
    });
}

window.main = main;