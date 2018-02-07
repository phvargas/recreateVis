var Selection = d3.select("#main-vis");
var visWidth = parseInt(Selection.style("width"));
var visHeight = parseInt(Selection.style("height"));

// add touch to mouseover and mouseout
var over = "ontouchstart" in window ? "touchstart" : "mouseover";
var out = "ontouchstart" in window ? "touchend" : "mouseout";


var margin = {top: 20, right: 20, bottom: 100, left: 40},
    width = visWidth - margin.left - margin.right,
    height = visHeight - margin.top - margin.bottom - 15;

/*
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */

// setup x
var xValue = function(d) {
			return d.x;
    },
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

/*
// setup y
var yValue = function(d) {
    //return d.ave_injury;
    return d.y;
    }, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");
*/
// setup y
var yValue = function(d) {
    //return d.ave_injury;
    return d.archived_at;
    }, // data -> value
    yScale = d3.scale.ordinal().rangeRoundBands([height, 0]),
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");


// setup fill color
var cValue = function(d) { return " ";},
    color = d3.scale.category10();

// add the graph canvas to the body of the webpage
var svg = Selection.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = Selection.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


// Get the data
d3.json("data/recreate.json", function(error, data) {
    var today = new Date();
    var inYears = 24 * 3600 * 1000 * 365;

    // unpack root-memento features
    var root_obj = {};
    root_obj['timestamp'] = convertToDate(data[0].root_memento.timestamp);
    root_obj['url'] = data[0].root_memento.url;
    root_obj['archieved_at'] = data[0].root_memento.archived_at;

    // sort resource data
    data[0].resources.sort(function(a, b){
        if (a.archieved_at < b.archieved_at) //sort string ascending
            return -1;
        if (a.archieved_at > b.archieved_at)
            return 1;
        return 0; //default return value (no sorting)
    });

    var resource_plot_values = [];
    var y_value = 1;
    var initial_archive = data[0].resources[0].archived_at;

    data[0].resources.forEach(function (d) {
        var val = {};

        if (d.archived_at != initial_archive){
            y_value++;
        }

        val.y = y_value;
        val.x = new Date(convertToDate(d.timestamp).getTime() - root_obj.timestamp.getTime()).getTime();
        val.archieved_at = d.archived_at;

        val.freq = 1;

        resource_plot_values .push(val);
    });


    plotResourceGraph(resource_plot_values);
});

// load data
function plotResourceGraph(data) {
	// don't want dots overlapping axis, so add in buffer to data domain
	xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
	//yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

	yScale.domain(data.map(function(d) { return d.archived_at; }));

	var xPosition;
	var yPosition;

    var title = 'Average Injuries by Age';
    var yText = '';
    var radius = 3.5;
    var minRadious = 2.7;

	// x-axis
	svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis)
	.append("text")
		.attr("class", "label")
		.attr("x", width)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text('timestamp');

	// y-axis
	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	.append("text")
	  .attr("class", "label")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text(yText);

	// draw dots
	svg.selectAll(".dot")
	  .data(data)
	.enter().append("circle")
	  .attr("class", "dot")
	  .attr("r", function (d) {
		  return  d.freq / (2 * Math.log(d.freq * 10)) * radius + minRadious;
      })
	  .attr("cx", xMap)
	  .attr("cy", yMap)
	  .style("fill", function (d) { return cValue(d); })
	  .style("opacity", 0.7)
      .on(over, verticesTooltipShow)
      .on(out, verticesTooltipHide);

    // plot title
	svg.append("text")
		.attr("x", (width / 2))
		.attr("y", 0 - (margin.top / 3) + 20)
		.attr("text-anchor", "middle")
		.text(title);

    // show tooltip of vertices
    function verticesTooltipShow(d) {
    	xPosition = d3.event.pageX + 10;
    	yPosition = d3.event.pageY;

    	if (xPosition >= visWidth - 100 )
    		xPosition -= 100;

        tooltip.style("opacity", 0.9)
            .html("<strong>timestamp</strong>: " + d.x + "<br />" +
                  "<strong>Time</strong>: " + (d.x).toFixed(2) +
			      "<br /> <strong>Personnel Inj</strong>:"  +  d.freq + "<br/>")
            .style("left", xPosition + "px")
			.style("top", yPosition + "px");
    }

    // hide tooltip of vertices
    function verticesTooltipHide() {
      tooltip.style("opacity", 0);
    }
}

function convertToDate(obj) {
    return new Date(parseInt(obj.substr(0,4)),
                    parseInt(obj.substr(4,2)) - 1,
                    parseInt(obj.substr(6,2)),
                    parseInt(obj.substr(8,2)),
                    parseInt(obj.substr(10,2)),
                    parseInt(obj.substr(12,2))
    );
}