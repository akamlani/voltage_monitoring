server.log("Agent Voltage Monitor Started");
server.log(http.agenturl());


/******************** Keen IO ****************************/
class KeenIO {
    _baseUrl = "https://api.keen.io/3.0/projects/";
    
    _projectId = null;
    _apiKey = null;
    
    constructor(projectId, apiKey) {
        _projectId = projectId;
        _apiKey = apiKey;
    }
    
    /***************************************************************************
    * Parameters: 
    *   eventCollection - the name of the collection you are pushing data to
    *   data - the data you are pushing
    *   cb - an optional callback to execute upon completion
    *
    * Returns: 
    *   HTTPResponse - if a callback was NOT specified  
    *   None - if a callback was specified
    ***************************************************************************/
    function sendEvent(eventCollection, data, cb = null) {
        local url = _buildUrl(eventCollection);
        local headers = {
            "Content-Type": "application/json"
        };
        local encodedData = http.jsonencode(data);
        server.log(encodedData);
        
        local request = http.post(url, headers, encodedData);
        
        // if a callback was specificed
        if (cb == null) {
            return request.sendsync();
        } else {
            request.sendasync(cb);
        }
    }
    
    /***************************************************************************
    * Parameters: 
    *   ts - the unix timestamp of the event
    *   millis - optional parameter to specify the milliseconds of the timestamp
    *
    * Returns: 
    * 	A formated KeenIO timestamp that can be inserted into the Keen event
    ***************************************************************************/    
    function getTimestamp(ts, millis = 0) {
        local m = ((millis % 1000) + "000000").slice(0, 6);
        local d = date(ts);
    
        return format("%04i-%02i-%02iT%02i:%02i:%02i.%sZ", d.year, d.month+1, d.day, d.hour, d.min, d.sec, m);
    }
    

    /*************** Private Functions - (DO NOT CALL EXTERNALLY) ***************/
    function _buildUrl(eventCollection, projectId = null, apiKey = null) {
        if (projectId == null) projectId = _projectId;
        if (apiKey == null) apiKey = _apiKey;
        
        
        local url = _baseUrl + projectId + "/events/" + eventCollection + "?api_key=" + apiKey;
        return url;
    }
}


/******************** CORE AGENT CODE ********************/

// Request from browser url
function httphandler(request, response) 
{
    server.log("Agent RFID url request"); 
    
    //?voltage=1&cell1=1&cell2=1&interval=5000&channelid=rfid-<x>
    //poll period in ms
    if("voltage" in request.query)
    {
        server.log("voltage state: " + request.query.cell1 + ", " + request.query.cell2);
        voltage_query  <- {"state": "voltage", 
                           "cell1": request.query.cell1.tointeger(), "cell2": request.query.cell2.tointeger(),
                           "poll":  request.query.poll.tointeger(), "channelid": request.query.channelid};
        device.send("voltage_measurement", voltage_query)
    }
    
    //?cancel=1&type=v
    //?cancel=1&type=i
    if("cancel" in request.query)
    {
    
    }
    
    response.send(200, "OK");
    //v_meas_response.send(200, voltage_data["cell1"] );
    //catch(ex) {response.send(500, ("Agent Error: " + ex));}
}
http.onrequest(httphandler);

//Keen.io
const KEEN_PROJECT_ID = "5419e2397d8cb927fb3bf8a5";
KEEN_WRITE_API_KEY <- "32bed1b95f93f32f7f5f5802e8e" +
                      "f16af06b1878e8d7f8968037b81" +
                      "ac2b723fcff1bbda22732ac9ae8" +
                      "84f34fe5c8c70af16d8ea058395" +
                      "74e08c40b8dca7e6157ed6ebd1a" +
                      "0de24735395b30ba9fbf7a3fe21" +
                      "cbfd34c29a1d65cf403b1ca09ff" +
                      "06a6df25df66b404d6a2ef3af0f8b4b3ad5";
                           
keen <- KeenIO(KEEN_PROJECT_ID, KEEN_WRITE_API_KEY);

//API Interfaces for Device
function send_voltage(board_id, voltage_data)
{
    // send an event asyncronously
    eventData <- {id = board_id, voltage = {cell1 = voltage_data["cell1"], cell2 = voltage_data["cell2"]} };
    keen.sendEvent("voltageMeasurement", eventData, function(resp) {server.log("Response KeenIO: " + resp.statuscode + ": " + resp.body);});
}

device.on("send_voltage", board_id, send_voltage);

function send_current(current_data)
{
}
device.on("current.response", send_current);

