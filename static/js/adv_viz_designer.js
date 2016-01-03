jQuery(document).ready(function($) {
    $('.share').click(function() {
        var NWin = window.open($(this).prop('href'), '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
        if (window.focus) {
            NWin.focus();
        }
        return false;
    });
});
// API tokens 
//L.mapbox.accessToken = mapbox_accessToken;
mapboxgl.accessToken = mapboxgl_accessToken;
//Global variables
var heatColors1 = {
    0.1: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
};
var heatColors2 = {
    0.1: 'purple',
    0.6: 'pink',
    0.7: 'blue',
    0.8: 'yellow',
    1.0: 'orange'
};
var heatColors3 = {
    0.1: 'green',
    0.6: 'aquamarine',
    0.7: 'blanchedalmond',
    0.8: 'coral',
    1.0: 'red'
};

var lineHeatStyle = {
    "id": "linestring",
    "type": "line",
    "source": "linestring",
    "layout": {
        "line-cap": "round",
        "line-join": "round"
    },
    "paint": {
        "line-opacity": parseFloat(document.getElementById("line_opacity").value),
        "line-width": parseFloat(document.getElementById("line_width").value),
        "line-color": document.getElementById("line_color").value
    },
    "transition": {
        "duration": 300,
        "delay": 0
    }

};
var draw_canvas;
var heatPoints;
var stravaLineGeoJson;
var linestring_src;
var heat;
var maxScale;
//var map = L.mapbox.map('map').setView(center_point, 10)
if (!mapboxgl.supported()) {
    alert('Your browser does not support Mapbox GL');
} else {
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn',
        center: mapboxgl.LngLat.convert(center_point),
        zoom: 9,
        minZoom: 3,
        maxZoom: 17,
        attributionControl: true
        });
}

function getDataHeat() {
    var r = $.Deferred();
    $.getJSON(heatpoint_url, function(data) {
        heatPointsRaw = JSON.parse(data);
        heatPoints = heatPointsRaw.map(function(p) {
            maxScale = Math.max(p[document.getElementById('heattype').value])
            return [p['lt'], p['lg'],
                p[document.getElementById('heattype').value]
            ];
        });
        r.resolve();
    });
    return r;
};

function getDataLinestring() {
    var r = $.Deferred();
    $.getJSON(heatline_url, function(data) {
        stravaLineGeoJson = data;
        r.resolve();
    });
    return r;
};

function addLayerHeat() {
    // Mapbox JS Api - import heatmap layer
    var heatConfig = {
        minOpacity: parseFloat(0.5),
        radius: parseFloat(5),
        blur: parseFloat(5),
        max: parseFloat(maxScale),
        gradient: heatColors1
    };
    heat = L.heatLayer(heatPoints, heatConfig).addTo(map);
    map.removeLayer(heat);
};

function addLayerLinestring() {
    //Create source for linestrings
    linestring_src = new mapboxgl.GeoJSONSource({
        data: stravaLineGeoJson,
        maxzoom: 17,
        buffer: 10,
        tolerance: 0.5
    });
    try {
        map.addSource('linestring', linestring_src);
    } catch (err) {
            console.log(err);
    }
    try {
        map.addLayer(lineHeatStyle);
    } catch (err) {
            console.log(err);
    }
    render();
};

//Load the data asrchnoutsly from api, then add layers to map
//getDataHeat().done(addLayerHeat);
map.addControl(new mapboxgl.Navigation({position: 'top-left'}));
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.once('style.load', function() {
    getDataLinestring().done(addLayerLinestring);
});


//Stop the loading bar when ajax requests complete
$(document).one("ajaxStop", function() {
    $("#loading").hide();
});

//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype
$('#VizType').change(function() {
    var selector = '#VizType_hide_' + $(this).val();
    //hide all elements
    $('#VizType_hide_heat-line').collapse('hide');
    $('#VizType_hide_heat-point').collapse('hide');
    //show only element connected to selected option
    $(selector).collapse('show');
});

$('#line_width').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#line_width').slider().on('slide', function(ev) {
    $('#line_width').slider('setValue', ev.value);
    render();
});
$('#line_opacity').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#line_opacity').slider().on('slide', function(ev) {
    $('#line_opacity').slider('setValue', ev.value);
    render();
});
$('#blur').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#blur').slider().on('slide', function(ev) {
    $('#blur').slider('setValue', ev.value);
    render();
});
$('#radius').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#radius').slider().on('slide', function(ev) {
    $('#radius').slider('setValue', ev.value);
    render();
});
$('#minOpacity').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#minOpacity').slider().on('slide', function(ev) {
    $('#minOpacity').slider('setValue', ev.value);
    render();
});
$('#Refresh').on('click touch tap', switchMapStyle);
$('#Refresh').on('click touch tap', render);
$('#heat_color').change(render);
$('#VizType').change(render);
$('#mapStyle').change(switchMapStyle);
$('#heattype').change(render);
$('#heat_color').change(render);
$('#line_color').change(render);
$('#snap').on('click touch tap', generateMap);

var VizType = 'heat-line'
var map_style = 'dark-nolabel'

function switchLayer() {
    layer = document.getElementById("mapStyle").value
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v8');
    } else {
        map.setStyle('mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn');
    }
    map.on('style.load', function() {
        addLayerLinestring();
    });
};

function set_visibility(mapid, id, onoff) {
    var visibility = mapid.getLayoutProperty(id, 'visibility');
    if (onoff == 'off') {
        mapid.setLayoutProperty(id, 'visibility', 'none');
    } else if (onoff == 'on') {
        mapid.setLayoutProperty(id, 'visibility', 'visible');
    }
};

function paintLayer(mapid, color, width, opacity, layer) {
    mapid.setPaintProperty(layer, 'line-color', color);
    mapid.setPaintProperty(layer, 'line-width', width);
    mapid.setPaintProperty(layer, 'line-opacity', opacity);
}

function updateHeat() {
    if (document.getElementById("heat_color").value == "heatColors2") {
        heatColors = heatColors2
    } else if (document.getElementById("heat_color").value == "heatColors3") {
        heatColors = heatColors3
    } else {
        heatColors = heatColors1
    }

    heatPoints = heatPointsRaw.map(function(p) {
        maxScale = Math.max(p[document.getElementById('heattype').value])
        return [p['lt'], p['lg'],
            p[document.getElementById('heattype').value]
        ];
    });

    heatConfig = {
        minOpacity: parseFloat($('#minOpacity').slider('getValue')),
        radius: parseFloat($('#radius').slider('getValue')),
        blur: parseFloat($('#blur').slider('getValue')),
        max: parseFloat(maxScale),
        gradient: heatColors
    };
}

function switchMapStyle() {
    //Check if the mapStyle changed - if so, change it here
    if (document.getElementById("mapStyle").value != map_style) {
        switchLayer();
        map_style = document.getElementById("mapStyle").value;
    }
}

function render() {
    //Check if the viz type changed - if so, change it here  
    if (document.getElementById("VizType").value != VizType) {
        if (document.getElementById("VizType").value == "heat-point") {
            try {
                set_visibility(map, 'linestring', 'off')
            } catch (err) {
                console.log(err);
            }
            try {
                heat.addTo(map)
            } catch (err) {
                console.log(err);
            }
            VizType = 'heat-point'
        } else if (document.getElementById("VizType").value == "heat-line") {
            try {
                map.removeLayer(heat);
            } catch (err) {
                console.log(err);
            }
            try {
                set_visibility(map, 'linestring', 'on');
                paintLayer(gl,
                    document.getElementById("line_color").value,
                    parseFloat($('#line_width').slider('getValue')),
                    parseFloat($('#line_opacity').slider('getValue')),
                    'linestring');
            } catch (err) {
                console.log(err);
            }
            VizType = 'heat-line'
        }
        //Check if the viz type did not change - if so, update values and render here
    } else if (document.getElementById("VizType").value == VizType) {
        if (VizType == 'heat-point') {
            //update the heatmap
            try {
                updateHeat();
                heat.setOptions(heatConfig);
            } catch (err) {
                console.log(err);
            }
        } else if (VizType == 'heat-line') {
            //Update the linestring layer
            try {
                paintLayer(map,
                    document.getElementById("line_color").value,
                    parseFloat($('#line_width').slider('getValue')),
                    parseFloat($('#line_opacity').slider('getValue')),
                    'linestring');
            } catch (err) {
                console.log(err);
            }
        }
    }
}

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}

/**
 * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 */
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
        width: srcWidth * ratio,
        height: srcHeight * ratio
    };
}

// Helper functions
function toPixels(length) {
    'use strict';
    var unit = 'in';
    var conversionFactor = 96;
    if (unit == 'mm') {
        conversionFactor /= 25.4;
    }
    return conversionFactor * length + 'px';
}

//Download link
function download_img(link, img_src, filename) {
    link.href = img_src;
    link.download = filename;
}

// High-res map rendering
function generateMap() {
    'use strict';
    //Disable buttons until objects are loaded
    document.getElementById('spinner').style.display = 'inline-block';
    $('#social').hide();
    document.getElementById('snap').classList.add('disabled');
    document.getElementById('download_viz').classList.add('disabled');
    document.getElementById('img_share_url').classList.add('disabled');
    $("#loading").show();
    //Get the current map style
    var style;
    var layer = document.getElementById("mapStyle").value
    if (layer != 'dark-nolabel') {
        style = 'mapbox://styles/mapbox/' + layer + '-v8';
    } else {
        style = 'mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn';
    }
    //Set image quality
    var width = 8;
    var height = 6;
    var dpi = 350;
    var format = 'png';
    var unit = 'in';
    //get current map settings to recreate in backcanvas for image
    var zoom = map.getZoom();
    var center = map.getCenter();
    var bearing = map.getBearing();
    //function to create the map
    createPrintMap(width, height, dpi, format, unit, zoom, center,
        bearing, style);
}

function createPrintMap(width, height, dpi, format, unit, zoom, center,
    bearing, style, source) {
    'use strict';

    // Calculate pixel ratio
    var actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {
            return dpi / 96
        }
    });

    // Create map container
    var hidden = document.createElement('div');
    hidden.className = 'hidden-map';
    document.body.appendChild(hidden);
    var container = document.createElement('div');
    container.style.width = toPixels(width);
    container.style.height = toPixels(height);
    hidden.appendChild(container);
    //remove any existing image elements
    snapshot.innerHTML = '';
    var img = document.createElement('img');
    //Show loading image
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (w > 640) {
        w = 640;
        h = 480;
    } else {
        w = w * 0.8;
        h = h * 0.8;
    }
    img.width = 250;
    img.height = 250;
    img.src = "/static/img/loading.gif";
    snapshot.appendChild(img);
    $("#snapshot_img").addClass("img-responsive center-block");
    //hide the loading bar, and begin creating the image in the background
    $("#loading").hide();
    

    // Create backcanvas map for high-rez image
    var renderMap = new mapboxgl.Map({
        container: container,
        center: center,
        zoom: zoom,
        style: style,
        bearing: bearing,
        interactive: false,
        attributionControl: true,
        preserveDrawingBuffer: true
    });

    renderMap.on('style.load', function addLayers() {
        linestring_src = new mapboxgl.GeoJSONSource({
            data: stravaLineGeoJson,
            maxzoom: 20
        });
        renderMap.addSource('linestring', linestring_src);
        renderMap.addLayer(lineHeatStyle);
        paintLayer(renderMap,
            document.getElementById("line_color").value,
            parseFloat($('#line_width').slider('getValue')),
            parseFloat($('#line_opacity').slider('getValue')),
            'linestring');
    });

    renderMap.once('load', function createImage() {
        try {
            var canvas = renderMap.getCanvas();
            var gl = canvas.getContext("webgl", {antialias: true});
            var targetDims = calculateAspectRatioFit(canvas.width, canvas.height, w, h);
            img.width = targetDims['width'];
            img.height = targetDims['height'];
            img.href = img.src;
            img.id = 'snapshot_img';
            var imgsrc = canvas.toDataURL("image/jpeg", 0.8);
            var file;
            img.class = "img-responsive center-block";
            img.src = imgsrc;
            if (canvas.toBlob) {
                canvas.toBlob(
                    function (blob) {
                        // Do something with the blob object,
                        var randNum = Math.floor(Math.random() * (1000000 - 100 + 1)) + 100;
                        file = new File([blob], "ADV_" + ath_name + "_" + randNum + ".jpg", {
                            type: "image/jpeg"
                        });
                    },
                    'image/jpeg', 0.99
                );
            } 
            //put the new image in the div
            snapshot.innerHTML = '';
            snapshot.appendChild(img);
            $("#snapshot_img").addClass("img-responsive center-block");
            get_signed_request(file);
        } catch (err) {
            console.log(err);
        }

        renderMap.remove();
        hidden.parentNode.removeChild(hidden);
        Object.defineProperty(window, 'devicePixelRatio', {
            get: function() {
                return actualPixelRatio
            }
        });
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('snap').classList.remove('disabled');
    });

}

///////////////////  Error Modal  //////////
var origBodyPaddingRight;

function openErrorModal(msg) {
    'use strict';
    var modal = document.getElementById('errorModal');
    document.getElementById('modal-error-text').innerHTML = msg;
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    document.getElementById('modal-backdrop').style.height =
        modal.scrollHeight + 'px';

    if (document.body.scrollHeight > document.documentElement.clientHeight) {
        origBodyPaddingRight = document.body.style.paddingRight;
        var padding = parseInt((document.body.style.paddingRight || 0), 10);
        document.body.style.paddingRight = padding + measureScrollbar() + 'px';
    }
}

function closeErrorModal() {
    'use strict';
    document.getElementById('errorModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = origBodyPaddingRight;
}

function measureScrollbar() {
    'use strict';
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    document.body.appendChild(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
}
