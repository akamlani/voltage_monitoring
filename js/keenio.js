console.log("Entry Point for Shepherd Voltage Measurement");
var config = [];
var client = createClient();

function createClient() {
		var write_key =  "32bed1b95f93f32f7f5f5802e8e" +
	                   	 "f16af06b1878e8d7f8968037b81" +
	                  	 "ac2b723fcff1bbda22732ac9ae8" +
	                 	 "84f34fe5c8c70af16d8ea058395" +
	                  	 "74e08c40b8dca7e6157ed6ebd1a" +
	                  	 "0de24735395b30ba9fbf7a3fe21" +
	                  	 "cbfd34c29a1d65cf403b1ca09ff" +
	                  	 "06a6df25df66b404d6a2ef3af0f8b4b3ad5";

        var read_key =   "6e14b09e210144b90be39c0c60f" +
        				 "76b6b73e487176a7a6b87421d47" + 
        				 "3176aaeff46056dc6ec0d7bde4b" +
        				 "bdceacb46c6ee50300ee4ad7e58" +
        				 "cff7fbe70283e34d17497e2cd17" +
        				 "d7a62a364446a9e53fc224acdde" +
        				 "302e1a1e480bd62cc956cfe6e6a" +
        				 "f752310d7cfb2bba4ffd8415a145439096a";

		return new Keen({projectId: "5419e2397d8cb927fb3bf8a5", writeKey: write_key, readKey: read_key});
}

function jsonToCsv(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';
	for (var i = 0; i < array.length; i++) {
	    var line = '';
	    for (var index in array[i]) {
	        if (line != '') line += ','

	        line += array[i][index];
	    } 
	    str += line + '\r\n';
	}
	return str;
}

function downloadCsv(csv_data) {
		var encodedUri = encodeURI(csv_data);

		var cdate = new Date();
		var datetime = cdate.getDate() + "/"+  (parseInt(cdate.getMonth())    + 1)
	    + "/" + cdate.getFullYear() + "@"  + cdate.getHours() + ":"  
	    + cdate.getMinutes() + ":" + cdate.getSeconds(); 

		var link = document.createElement("a");
		link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
		link.setAttribute("download", "voltagereport-" + datetime + ".csv");
		link.click();
}

function buildTableSample(idx, timestamp, voltage) {
	var voltage_tabular_row = 	"<tr>" +
								"<td>" + idx + "</td>" +
			  					"<td>" + timestamp + "</td>" +
			  					"<td>" + voltage + "</td>" +
			  					"</tr>";
	return voltage_tabular_row;
}


function getSamplesFormat(cell1_on, cell2_on, format_type) {
	var query_data = {eventCollection: "voltageMeasurement", groupBy: "property"};
	var extraction = new Keen.Query('extraction', query_data);
	client.run(extraction, function(response) {
		var vcell1; var vcell2; var tabular_data = []; var table_data = [];
		tabular_data.push({"id": "BOARD ID", "timestamp": "TIMESTAMP", "cell1": "VOLTAGE (Cell1)", "cell2": "VOLTAGE (Cell2)"});
		table_data.push('<thead><tr><th>Sample #</th><th>Timestamp</th><th>Voltage</th></tr></thead>');

		for(var idx in response.result) {
			var entry = response.result[idx];
			if (format_type == "csv") {	
				var row = {"id": config["Board Name"], "timestamp": Date(entry.keen.timestamp)};
				if(cell1_on != undefined) {row["cell1"] =  entry.voltage.cell1;}
				if(cell2_on != undefined) {row["cell2"] =  entry.voltage.cell2;}
				tabular_data.push(row);
			}
			if (format_type == "table") {
				if(cell1_on != undefined) { 
					var row = buildTableSample(idx, Date(entry.keen.timestamp), entry.voltage.cell1);
					table_data.push(row);
				}
				if(cell2_on != undefined) { 
					var row = buildTableSample(idx, Date(entry.keen.timestamp), entry.voltage.cell2);
					table_data.push(row);
				}
			}
		}

		
		if (format_type == "csv") {
			var jsonObject = JSON.stringify(tabular_data);
			var csv_data = jsonToCsv(jsonObject);
			downloadCsv(csv_data);
		}
		if (format_type == "table") {
			//$("#battery-samples-cell1").append(table_data);
			//$("#battery-samples-cell2").append(table_data);
		}
	});
}



function metricsForCells(target_property_val) {
	//add timeframe: "today"
	//add interval:	
	var count_query_data = {eventCollection: "voltageMeasurement", groupBy: "property"};
	var metric_query_data = {eventCollection: "voltageMeasurement", groupBy: "property", targetProperty: target_property_val};
	var metric_percentile_data = {eventCollection: "voltageMeasurement", groupBy: "property", targetProperty: target_property_val, percentile: "95.0"};

	var count_samples = new Keen.Query("count", count_query_data);	
	var metrics_max = new Keen.Query("maximum", metric_query_data);
	var metrics_min = new Keen.Query("minimum", metric_query_data);
	var metrics_avg = new Keen.Query("average", metric_query_data);
	var metrics_median = new Keen.Query("median", metric_query_data);
	var metrics_percentile = new Keen.Query("percentile", metric_percentile_data);

	var metric_label = "";
	var labels = ["Number of Records: ", "Minimum Voltage: ", "Maximum Voltage: ", "Average Voltage: ", "Median Voltage: ", "Percentile Voltage (95%): "];
	var mashup_query = [count_samples, metrics_min, metrics_max, metrics_avg, metrics_median, metrics_percentile];
	var mashup = client.run(mashup_query, function(response) {
		for(var idx in response) {
			var metric = response[idx].result[0].result;
			metric = metric.toFixed(3);
			metric_label += "<b>" + labels[idx] + "</b><br>" + metric + "<br>";
		}

		if(target_property_val == "voltage.cell1") {	
			$("#analytics-metrics-cell1").html( (metric_label) );
		}
		if(target_property_val == "voltage.cell2") {
			$("#analytics-metrics-cell2").html( (metric_label) );
		}
	});

	//alternative method of feeding in a list of Queries

}

function setConfiguration() {
	config =  {
		"Board Name": document.getElementById('ctl-board-name').value,
		"Sample Period": document.getElementById('ctl-samplerate').value,
		"Monitor Cell1": $("#v_cell1").prop('checked'),
		"Monitor Cell2": $("#v_cell2").prop('checked'),
		"Metrics Cell1": $("#m_cell1").prop('checked'),
		"Metrics Cell2": $("#m_cell2").prop('checked'),
	};
	//Metrics
	if(config["Metrics Cell1"]) { metricsForCells("voltage.cell1"); }
	if(config["Metrics Cell2"]) { metricsForCells("voltage.cell2"); }
	//Voltage Monitoring to CSV
	getSamplesFormat(config["Monitor Cell1"], config["Monitor Cell2"], "csv"); 
	//Display Tables of Top 5 Most Recent Samples
}


function estimateDischarge() {
	//Retrieve Most Recent Voltage Sample: Battery Cell1, Battery Cell2
	//Read in CSV Data of Discharge Information
	//Calculate Remaining Capacity based on current Voltage
	//Display Used and Remaining Capacity
	//Display Hours and Days of Remaining Capacity
	//Display Percentage based on Fraction of Capacity
}

//repositories:
//http://github.com/keenlabs/keen-js


//graphs:
//client.draw(query, selector, config)
//client.draw(query, $("#chart-wrapper"), {chartType: "columnchart", title: "Custom chart title"});


//client initiated (asynchronously) event via electric imp method: 
//eventData <- {id = board_id, voltage = {cell1 = voltage_data["cell1"], cell2 = voltage_data["cell2"]} };
//keen.sendEvent("voltageMeasurement", eventData, function(resp) {server.log("Response KeenIO: " + resp.statuscode + ": " + resp.body);});

