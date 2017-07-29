
var color_list = [
    chroma.scale('YlGnBu').mode('lab').colors(5),
    chroma.scale('RdPu').mode('lab').colors(5),
    chroma.scale('YlOrRd').mode('lab').colors(5),
    chroma.scale('YlOrBr').mode('lab').colors(5),
    chroma.scale('RdBu').mode('lab').colors(5),
    chroma.scale('RdYlGn').mode('lab').colors(5),
    chroma.scale('Blues').mode('lab').colors(5),
    chroma.scale('Greens').mode('lab').colors(5),
    chroma.scale('Purples').mode('lab').colors(5),
    chroma.scale('Oranges').mode('lab').colors(5)
]


//Global variables for heat-points
var breaks = [3, 6, 9, 12, 16];
var colors = color_list[0];
var layers = [];
var filters = [];
var layernames = [];
var heatpopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

function updateHeatLegend() {
    document.getElementById('legend-points-param').textContent = $("#heattype option:selected").text();
}

function calcBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    breaks = []; //empty the breaks array
    var binSize = maxval / numbins;
    for (p = 1; p <= numbins; p++) {
        breaks.push(Math.round(binSize * p * 10) / 10);
    }
    updateHeatLegend();
    for (p = 0; p < breaks.length; p++) {
        calcLegends(p, 'heat-point');
    }
}

function calcHeatLayers() {
    //create layers with filters
    layers = [];
    layernames = [];
    layers.push({
        id: 'heatpoints-0',
        type: 'circle',
        source: 'heatpoint',
        paint: {
            "circle-radius": {
                stops: [
                    [4, 0.1],
                    [10, 1],
                    [20, 10]
                ]
            },
            "circle-color": {
                property: 's',
                stops: [
                    [breaks[0], colors[0]],
                    [breaks[1], colors[1]],
                    [breaks[2], colors[2]],
                    [breaks[3], colors[3]],
                    [breaks[4], colors[4]]
                ]
            },
            "circle-opacity": 0.8,
            "circle-blur": 0.5
        }
    });
    layernames.push('heatpoints-0');
}

//Update heatpoints properties
function paintCircleLayer(mapid, layer, opacity, radius, blur, pitch) {
    mapid.setPitch(pitch);
    colors = color_list[parseFloat(document.getElementById('heat_color').value)];
    calcBreaks(parseFloat($('#scale').slider('getValue')), colors.length);
    circle_color_property = document.getElementById('heattype').value
    radius_values = [radius * 1, radius * 2, radius * 4, radius * 6, radius * 8]
    circle_radius_style = {
        "base": radius,
        "stops": [
            [4, radius_values[0]],
            [10, radius_values[1]],
            [20, radius_values[4]],
        ]
    };
    circle_color_style = {
        "property": circle_color_property,
        "stops": [
            [breaks[0], colors[0]],
            [breaks[1], colors[1]],
            [breaks[2], colors[2]],
            [breaks[3], colors[3]],
            [breaks[4], colors[4]]
        ]
    };
    mapid.setPaintProperty(layer + '-' + 0, 'circle-radius', circle_radius_style);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-color', circle_color_style);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-blur', blur);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-opacity', opacity);

}