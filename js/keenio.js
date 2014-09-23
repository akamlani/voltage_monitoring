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

function getSamplesFormat(format_type) {
	var query_data = {eventCollection: "voltageMeasurement", groupBy: "property"};
	var extraction = new Keen.Query('extraction', query_data);
	client.run(extraction, function(response) {
		var tabular_data = [];
		tabular_data.push({"id": "BOARD ID", "timestamp": "TIMESTAMP", 
						   "cell1": "VOLTAGE (Cell1)", "cell2": "VOLTAGE (Cell2)"});

		var data_samples = response.result;
		for(var idx in data_samples) {
			var entry = data_samples[idx];
			var row = {"id": config["Board Name"], "timestamp": Date(entry.keen.timestamp), 
					   "cell1": entry.voltage.cell1, "cell2": entry.voltage.cell2};
			tabular_data.push(row);
		}
		//option: write to csv format
		var jsonObject = JSON.stringify(tabular_data);
		var csv_data = jsonToCsv(jsonObject);
		
/*		
var a = document.createElement('a');
a.href     = 'data:attachment/csv,' + csv_data;
a.target   ='_blank';
a.download = 'myFile.csv,' + encodeURIComponent(csv_data); ;
a.innerHTML = "Click me to download the file.";
document.body.appendChild(a);
*/

		//option: keep as json format
	});
}


function displaySamples(data_samples, max_samples) {
	for(var idx in data_samples) {
		var entry = data_samples[idx];
		var row = {"id": config["Board Name"], "timestamp": entry.keen.timestamp, 
				   "cell1": entry.voltage.cell1, "cell2": entry.voltage.cell2};

		//Create Table to Push into Google Docs
		tabular_data.push(row);
/*		
		if(idx < max_samples) {
			var cell1_entry = "<tr>" +
							  "<td>" + idx + "</td>" +
							  "<td>" + new Date(entry.keen.timestamp).toUTCString() + "</td>" +
							  "<td>" + entry.voltage.cell1 + "</td>" +
							  "</tr>";

			var cell2_entry = "<tr>" +
							  "<td>" + idx + "</td>" +
							  "<td>" + new Date(entry.keen.timestamp).toUTCString() + "</td>" +
							  "<td>" + entry.voltage.cell2 + "</td>" +
							  "</tr>";

			$("#battery-samples-cell1").append(cell1_entry);
			$("#battery-samples-cell2").append(cell2_entry);
		}
*/
	}
	//Create CSV


}

function metricsForCells(target_property_val) {
	//add timeframe: "today"
	//add interval:	
	var count_query_data = {eventCollection: "voltageMeasurement", groupBy: "property"};

	var metric_query_data = {eventCollection: "voltageMeasurement", groupBy: "property", 
							 targetProperty: target_property_val};
	var metric_percentile_data = {eventCollection: "voltageMeasurement", groupBy: "property", 
							 	  targetProperty: target_property_val, percentile: "95.0"};

	var count_samples = new Keen.Query("count", count_query_data);	
	var metrics_max = new Keen.Query("maximum", metric_query_data);
	var metrics_min = new Keen.Query("minimum", metric_query_data);
	var metrics_avg = new Keen.Query("average", metric_query_data);
	var metrics_median = new Keen.Query("median", metric_query_data);
	var metrics_percentile = new Keen.Query("percentile", metric_percentile_data);


	var metric_label = "";
	var labels = ["Number of Records: ", "Minimum Voltage: ", "Maximum Voltage: ", 
			  	  "Average Voltage: ", "Median Voltage: ", "Percentile Voltage (95%): "];
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
}


function monitorForCells() {
	var json_data = getSamplesFormat("csv");
	

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
	//Voltage Monitoring
	if(config["Monitor Cell1"]) { monitorForCells("voltage.cell1"); }
	//if(config["Monitor Cell2"]) {}
	//CSV Format
	//getSamplesFormat("json");
}






/*
var tabular_data = [];
var samples = getSamples(client, tabular_data);
var data = client.run(samples, function(response){
	var keen_json = response.result;
	var header = '<thead><tr><th>Sample #</th><th>Timestamp</th><th>Voltage</th></tr></thead>';
	$("#battery-samples-cell1").append(header);
	$("#battery-samples-cell2").append(header);
	//display samples
	displaySamples(keen_json, 5);
	//Push into Google Docs - Google Spreadsheets "Add-Ons"
});
*/
