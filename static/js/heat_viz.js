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
        type: 'heatmap',
        source: 'heatpoint',
        paint: {
            "heatmap-radius": {
                stops: [
                    [0, 1],
                    [10, 5],
                    [20, 10]
                ]
            },
            "heatmap-color": {
                stops: [
                    [0, "rgba(0,0,0,0)"],
                    [0.2, colors[0]],
                    [0.4, colors[1]],
                    [0.6, colors[2]],
                    [0.8, colors[3]],
                    [1, colors[4]],
                ]
            },
            "heatmap-intensity": {
                "stops": [
                    [0, 0.1],
                    [10, 1],
                    [20, 5]
                ]
            },
            "heatmap-weight": {
                "property": "s",
                "type": "exponential",
                "stops": [
                    [0, 0],
                    [breaks[0], 0.2],
                    [breaks[1], 0.4],
                    [breaks[2], 0.6],
                    [breaks[3], 0.8],
                    [breaks[4], 1]
                ]
            },
            "heatmap-opacity": 0.8,
        }
    });
    layernames.push('heatpoints-0');
}

var heatParamConfig = {
    "s": { "low": 5, "high": 60, "step": 1 },
    "d": { "low": 5, "high": 100, "step": 1 },
    "g": { "low": 5, "high": 25, "step": 0.25 },
    "p": { "low": 100, "high": 1000, "step": 10 },
    "e": { "low": 100, "high": 20000, "step": 100 },
    "h": { "low": 40, "high": 220, "step": 5 },
    "c": { "low": 30, "high": 160, "step": 5 }
}

function setHeatRange() {
    var config = heatParamConfig[$('#heattype').val()]
    $('#scale').slider({
        min: config["low"],
        max: config["high"],
        step: config["step"]
    })
}

//Update heatpoints properties
function paintHeatmapLayer(mapid, layer, opacity, radius, blur, pitch) {
    
    colors = color_list[parseFloat(document.getElementById('heat_color').value)];
    let heatmap_color_style = {
        "stops": [
            [0, "rgba(0,0,0,0)"],
            [0.2, colors[0]],
            [0.4, colors[1]],
            [0.6, colors[2]],
            [0.8, colors[3]],
            [1, colors[4]],
        ]
    };
    mapid.setPaintProperty(layer + '-' + 0, 'heatmap-color', heatmap_color_style);

    calcBreaks(parseFloat($('#scale').slider('getValue')), colors.length);
    let heatmap_color_property = document.getElementById('heattype').value

    let heatmap_radius_style = {
        "base": radius,
        "stops": [
            [0, 1 * radius],
            [10, 5 * radius],
            [20, 10 * radius]
        ]
    };

    let heatmap_intensity_style = {
        "stops": [
            [0, blur / 10],
            [10, blur / 5],
            [20, blur / 2]
        ]
    }

    let heatmap_weight_style = {
        "property": heatmap_color_property,
        "type": "exponential",
        "stops": [
            [0, 0],
            [breaks[0], 0.2],
            [breaks[1], 0.4],
            [breaks[2], 0.6],
            [breaks[3], 0.8],
            [breaks[4], 1]
        ]
    }

    mapid.setPaintProperty(layer + '-' + 0, 'heatmap-radius', heatmap_radius_style);
    mapid.setPaintProperty(layer + '-' + 0, 'heatmap-weight', heatmap_weight_style);
    mapid.setPaintProperty(layer + '-' + 0, 'heatmap-intensity', heatmap_intensity_style);
    mapid.setPaintProperty(layer + '-' + 0, 'heatmap-opacity', opacity);
    mapid.setPitch(pitch);

}