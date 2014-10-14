//Voltage Measurements


// Device Statistics
function device_statistics()
{
    // Device ID
    server.log("device id: " + hardware.getdeviceid());
    // Display Mac Address
    server.log("device mac address: " + imp.getmacaddress());
    // Current Memory
    server.log("Imp Free Memory: " + imp.getmemoryfree());
    //Get hardware voltage
    server.log("Hardware Voltage: " + hardware.voltage());
    // Display fw rev
    server.log("Device Started (version: " + imp.getsoftwareversion() + ")");
    // Display environment
    server.log("Environment: " + imp.environment() + ":" + ENVIRONMENT_CARD);
}


// WiFi statistics
function wifi_statistics()
{
    // Display Device rssi
    server.log("raw rssi: " + imp.rssi());
    // Display BSSID
    server.log("BSSID: " + imp.getbssid());
    // Display SSID
    server.log("SSID: " + imp.getssid());
}


// Voltage Monitor
function voltage_monitor(pin_source)
{
    monitor <- pin_source;
    monitor.configure(ANALOG_IN);
    local rawvalue = monitor.read();
    //max value of 65535.0 and scaling to 0 - 5.0 volts
    local voltage = rawvalue * (hardware.voltage()/65535.0);  
    server.log("Voltage Monitor:" + rawvalue + "," + voltage);
    return voltage;
}

lastVoltageMeasurement <- null;
stateVoltageRequest <- null;

function voltage_measurement_poll() {
    imp.wakeup(stateVoltageRequest.poll, voltage_measurement_poll);
    local batv_cell1 = 0; local batv_cell2 = 0;
    local voltage_query_request = stateVoltageRequest;
    server.log("voltage_measurement_poll: " + voltage_query_request["cell1"] + ", " + voltage_query_request["cell2"]);

    if(voltage_query_request["cell1"] == 1) {
        //monitor output from battery cell 1
        batv_cell1 = voltage_monitor(hardware.pin1);       //hardware.pinA
    }
    
    if(voltage_query_request["cell2"] == 1) {
        //monitor output from battery cell 1
        batv_cell2 = voltage_monitor(hardware.pin2);       //hardware.pinC
    }
    
    server.log("Cell1 Voltage="+ batv_cell1 + " Cell2 Voltage="+ batv_cell2);    
    samples <- {"cell1": batv_cell1, "cell2": batv_cell2};
    agent.send("send_voltage", stateVoltageRequest.channelid, samples);
}


function voltage_measurement(voltage_query_request) {
    server.log("vmeas data:" + voltage_query_request["state"] + ", " +  voltage_query_request["cell1"] + ", " +  voltage_query_request["cell2"]);
    stateVoltageRequest <- voltage_query_request;
    voltage_measurement_poll();
}


function current_measurement(current_query_request) {server.log("imeas" + current_query_request);}

agent.on("voltage_measurement", voltage_measurement);
agent.on("current_measurement", current_measurement);

//Log Statistics
server.log("Shepherd UHF RFID Device Monitor")
device_statistics();
wifi_statistics();


//imp.setpowersave(true);
//server.log(imp.getpowersave());

