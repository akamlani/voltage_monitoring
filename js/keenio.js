console.log("Entry Point for Shepherd Voltage Measurement");

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


function configCountQuery() {
		var query_data = {eventCollection: "voltageMeasurement", groupBy: "property"/*, timeframe: "today"*/};
		return new Keen.Query("count", query_data);
}

function configMetricQuery(query_type) {
/*	
		///timeframe: "today"
		var metric_query_data = {eventCollection: "voltageMeasurement", groupBy: "property", 
								 targetProperty: "voltage.cell1"};
		var metric_percentile_data = {eventCollection: "voltageMeasurement", groupBy: "property", 
								 targetProperty: "voltage.cell1", percentile: "95.0"/};

		var metrics_max = new Keen.Query("maximum", metric_query_data);
		var metrics_min = new Keen.Query("minimum", metric_query_data);
		var metrics_avg = new Keen.Query("average", metric_query_data);
		var metrics_median = new Keen.Query("median", metric_query_data);
		var metrics_percentile = new Keen.Query("percentile", metric_percentile_data);

		//summary statistics
		//@todo: Fix for Multi-Analysis Usage API
		//@todo: Add GroupBy (Agent, Specific ID) = "group_by" -> "board.id (macaddress)"
		var labels = ["Number of Records: ", "Minimum Voltage: ", "Maximum Voltage: ", 
				  	  "Average Voltage: ", "Median Voltage: ", "Percentile Voltage (95%): "];


		var mashup_query = [count, metrics_min, metrics_max, metrics_avg, metrics_median, metrics_percentile];
		var mashup = client.run(mashup_query, function(response) {
			for(var idx in response) {
				var metric = response[idx].result[0].result;
				metric = metric.toFixed(3);
				var metric_label = "<b>" + labels[idx] + "</b>";
				$("#analytics-metrics").append(metric_label + metric + "<br>");
			}
		});
*/
}

function getSamples() {
		var query_data = {eventCollection: "voltageMeasurement", groupBy: "property"};
		var extraction = new Keen.Query('extraction', query_data);
		return extraction;
}

function displaySamples(data_samples, max_samples) {
	for(var idx in data_samples) {
		var entry = data_samples[idx];
		var row = {"id": "UHF_RFID", "timestamp": entry.keen.timestamp, 
				   "cell1": entry.voltage.cell1, "cell2": entry.voltage.cell2};

		//Create Table to Push into Google Docs
		tabular_data.push(row);
		
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
	}

}



var client = createClient();
var count  = configCountQuery();

var mashup = client.run(count, function(response) {
	var data = response.result[0].result;
	var metric_label = "<b>" + "# Samples: " + "</b>";
	$("#analytics-metrics-cell1").append(metric_label + data + "<br>");
	$("#analytics-metrics-cell2").append(metric_label + data + "<br>");

});

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

