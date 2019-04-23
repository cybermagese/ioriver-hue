'use strict';
const API = require('raw-hue-api');


const LOCAL_FROM = {
    "ZLLLightLevel": "lux",
    "ZLLPresence": "presence",
    "ZLLTemperature": "temp"
};

const LOCAL_STATE = {
    "lux": "lightlevel",
    "presence": "precence",
    "temp": "temperature"
};

const NameUnit = {
    "temp": "°C",
    "lux": "lux"
};

class IORiverHue {
    
    constructor() {
    }

    
    /**
     * @method init
     * @description set up the plugin
     * @param {*} platformconfig this platform config in ioriver's config.json
     * @param {*} ioriver_api ioriver's api/event emitter for plugins
     * @param {*} log general logging from server
     */
    async  init(platformconfig, ioriver_api, log) {
        this.config = platformconfig;
        this.log = log;
        this._api = ioriver_api;
        this.api = API;
        this.contact = false;
        log.warn('updating basesn');
        this.baseSn = (this.config.sn_x1000 * 1000) + this._api.baseSn;
        

        //check hue config
        if(this.config && this.config.ip && this.config.username) {
            let host = this.config.ip;
            let username = this.config.username;

            this.api.init(host, username);

            let hueconf = await this.api.getConfig()
            .catch((e)=>{
                this.log.warn(`ioriver-hue: Failed to contact controller`);
            });
            if(typeof hueconf !== 'undefined') {
                if(hueconf.zigbeechannel) {
                    this.contact = true;

                    //get all devices
                    await this.getSensors();
        
                    //registerPlatform when we are done
                    this._api.emit('registerPlatform', this);
                }
            }
            
        }

    }

    async getSensors() {
        var sensors = await this.api.listSensors()
        .catch((e)=>{
            this.log.warn(`ioriver-hue: Failed to list sensors`);
        });

        var list = {};
        if(typeof sensors !== 'undefined') {
            for(var id in sensors) {
                var sensor = sensors[id];
                if(typeof LOCAL_FROM[sensor.type] !== 'undefined') {
                    let uid = sensor.uniqueid.substr(0,23);
                    if(typeof list[uid] === 'undefined') {
                        list[uid] = {};
                    }
                    if(typeof list[uid].name === 'undefined' || sensor.productname !== sensor.name.substr(0,sensor.productname.length)) {
                        list[uid].name = sensor.name;
                        //list[uid].config.name = sensor.name;
                    }
                    if(typeof list[uid].id === 'undefined' || list[uid].id>id) {
                        list[uid].id = id;
                    }
                    if(typeof list[uid].inputs === 'undefined') {
                        list[uid].inputs = [];
                    }
                    var next = list[uid].inputs.length;
                    var name = LOCAL_FROM[sensor.type];
                    list[uid].inputs[next] = {
                        name: name,
                        value: 0,
                        unit:""
                    };
                    switch(list[uid].inputs[next].name) {
                        // lux
                        case LOCAL_FROM.ZLLLightLevel:
                        list[uid].inputs[next].value = sensor.state.lightlevel;
                        break;
                        // presence
                        case LOCAL_FROM.ZLLPresence:
                        if(sensor.state.presence) list[uid].inputs[next].value=1;
                        break;
                        // temp
                        case LOCAL_FROM.ZLLTemperature:
                        list[uid].inputs[next].value = sensor.state.temperature/100;
                        break;
                    }
                    if(NameUnit[name]) {
                        list[uid].inputs[next].unit = NameUnit[name];
                    }
                    if(typeof sensor.config.battery !== 'undefined') {
                        list[uid].battery = sensor.config.battery;
                    }
                }
            }

            var include = true;
            for(var mac in list) {
                include = true;
                if(typeof this.config.ignore_id_list !== 'undefined' && Array.isArray(this.config.ignore_id_list)) {
                    if(this.config.ignore_id_list.includes(list[mac].id)) {
                        include = false;
                    }
                }
                if(include===true) {
                    var proto = {};
                    proto = list[mac];
                    proto.isSensor=true;
                    proto.Sn = Number(this.baseSn) + Number(list[mac].id);
                    this._api.emit('registerDevice', proto);
                }
            }
        }

    }

    // Public  mandatory methods 
    
    async run() {
        this.log.debug('*** Running ioriver-hue');
        await this.getSensors();
        this.log.debug('*** End ioriver-hue run');
    }
    

    async setDim(serial,value) {
        
    }

    async setOnOff(serial, value) {
        
    }
}

module.exports = new IORiverHue();