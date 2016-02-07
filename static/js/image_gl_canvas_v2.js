var imgCanvas = {
    imgWidth : 1,
    imgHeight : 1,
    imgDpi : 450,
    container : {},
    mapSource : {},
    mapStyle : "",
    mapLayer : "",
    mapZoom : 1,
    mapCenter : 1,
    mapBearing : 1,
    map : {},
    renderMap : {},
    vitType : "",

    //init function
    init: function(map) {
            this.cacheDom();
            map = map;
            this.bindEvents();
        },

    cacheDom: function() {
        this.$social = $('#social');
        this.$loadingSocial = $('#loading_social');
        this.$snap = $('#snap');
        this.$download_viz = $('#download_viz');
        this.$img_share_url = $('#img_share_url');
        this.$loading = $('#loading');
        this.$mapStyle = $('#mapStyle');
        this.$snapshotImg = $('#snapshot_img');
        this.$vizType = $('#VizType');
    },

    //class helper functions

    toPixels: function(length) {
        var unit = 'in';
        var conversionFactor = 96;
        if (unit == 'mm') {
            conversionFactor /= 25.4;
        }
        return conversionFactor * length + 'px';
    },

    updateDom: function(state) {
        if (state == 'hide') {
            this.$social.hide();
            this.$loadingSocial.show();
            this.$snap.addClass('disabled');
            this.$download_viz.addClass('disabled');
            this.$img_share_url.addClass('disabled');
            this.$loading.show();
        } else {
            this.$social.show();
            this.$loadingSocial.hide();
            this.$snap.removeClass('disabled');
            this.$download_viz.removeClass('disabled');
            this.$img_share_url.removeClass('disabled');
            this.$loading.hide();
        }
    },

    bindEvents: function() {
        this.$snap.on('click', this.generateMap.bind(this));
    },

    getMap: function() {
        this.mapLayer = $('#mapStyle').val();
        console.log(this.mapLayer)
        if (this.mapLayer != 'dark-nolabel') {
            this.mapStyle = 'mapbox://styles/mapbox/' + this.mapLayer + '-v8';
        } else {
            this.mapStyle = 'mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn';
        }
        console.log(this.mapStyle)
        this.mapZoom = map.getZoom();
        this.mapCenter = map.getCenter();
        this.mapBearing = map.getBearing();
    },

    getPixelRatio: function(imgDpi) {
        // Return the pixel ratio of the cleint browser device
        var actualPixelRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', {
            get: function() {
                return imgDpi / 96
            }
        });
    },

    //core class functions

    createRenderMap: function() {
        vizType = this.$vizType.val()
        // Create backcanvas map for high-rez image
        renderMap = new mapboxgl.Map({
            container: container,
            center: this.mapCenter,
            zoom: this.mapZoom,
            style: this.mapStyle,
            bearing: this.mapBearing,
            interactive: false,
            attributionControl: true,
            preserveDrawingBuffer: true
        });
        
        function addLayers(callback) {
            if (vizType = "heat-line") {
                linestring_src = new mapboxgl.GeoJSONSource({
                    data: stravaLineGeoJson,
                    maxzoom: 18,
                    buffer: 500,
                    tolerance: 1
                });
                renderMap.addSource('linestring', linestring_src);
                renderMap.addLayer(lineHeatStyle);
                paintLayer(renderMap,
                    document.getElementById("line_color").value,
                    parseFloat($('#line_width').slider('getValue')),
                    parseFloat($('#line_opacity').slider('getValue')),
                    'linestring');
            } else if (vizType = "heat-point") {
                heatpoint_src = new mapboxgl.GeoJSONSource({
                    data: heatpoint_data,
                    maxzoom: 18,
                    buffer: 500,
                    tolerance: 1
                });
                renderMap.addSource('heatpoint', heatpoint_src);
                renderMap.batch(function(batch) {
                    for (var p = 0; p < layers.length; p++) {
                        batch.addLayer(layers[p]);
                    }
                });
                paintCircleLayer(renderMap, 'heatpoints',
                    parseFloat($('#minOpacity').slider('getValue')),
                    parseFloat($('#radius').slider('getValue')),
                    parseFloat($('#blur').slider('getValue')));
            }
        }

        renderMap.once('load', addLayers(createHighRezImage()));

        function createHighRezImage() {
            setTimeout(function() {
                try {
                    var canvas = renderMap.getCanvas();
                    var targetDims = calculateAspectRatioFit(canvas.width, canvas.height, w, h);
                    img.width = targetDims['width'];
                    img.height = targetDims['height'];
                    img.href = img.src;
                    img.id = 'snapshot_img';
                    var imgsrc = canvas.toDataURL("image/jpeg", 0.8);
                    var file;
                    img.class = "img-responsive center-block";
                    img.src = imgsrc;
                    //put the new image in the div
                    snapshot.innerHTML = '';
                    snapshot.appendChild(img);
                    $("#snapshot_img").addClass("img-responsive center-block");
                    //Now create the high rez image and upload it to the server
                    if (canvas.toBlob) {
                        canvas.toBlob(
                            function(blob) {
                                // Do something with the blob object,
                                randNum = Math.floor(Math.random() * (1000000 - 100 + 1)) + 100;
                                filename = "ADV_" + ath_name + "_" + randNum + ".jpg";
                                console.log('creating file...');
                                file = new File([blob], filename, {
                                    type: "image/jpeg"
                                });
                                console.log('getting file to server...');
                                imgBlob = blob;
                                get_signed_request(file);

                            },
                            'image/jpeg', 0.99
                        );
                    } else {}
                } catch (err) {
                    console.log(err);
                    window.alert("Please try a different browser - only Chrome and Firefox are supported for design ordering and sharing!");
                    document.getElementById('spinner').style.display = 'none';
                    this.$snap.removeClass('disabled');
                }
                renderMap.remove();
                hidden.parentNode.removeChild(hidden);
            }, 500);
        }

        //renderMap.once('load', createHighRezImage());
    },

    createPreviewImg: function(callback) {
        // Create map image container
        var hidden = document.createElement('div');
        hidden.className = 'hidden-map';
        document.body.appendChild(hidden);
        container = document.createElement('div');
        container.style.width = this.toPixels(this.imgWidth);
        container.style.height = this.toPixels(this.imgHeight);
        hidden.appendChild(container);
        //remove any existing image elements
        snapshot.innerHTML = '';
        this.getPixelRatio();
        var img = document.createElement('img');
        //Show loading image
        var w = window.innerWidth;
        var h = window.innerHeight;
        console.log("width : " + w + " height: " + h)
        if (w > 640) {
            w = 640;
            h = 480;
        } 
        else {
            w = w * 0.8;
            h = h * 0.8;
        }
        img.width = 250;
        img.height = 200;
        img.src = "/static/img/loading.gif";
        snapshot.appendChild(img);
        this.$snapshotImg.addClass("center-block");
        //hide the loading bar, and begin creating the image in the background
        this.$loading.hide();
        callback();
    },

    calculateAspectRatioFit: function(srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio
        }
    },

    generateMap: function() {
        //Convienence function to call all sub-functions required for creating a print map on ADV
        this.updateDom('hide');
        this.getMap();
        this.createPreviewImg(this.createRenderMap());
        this.updateDom('show');
    }
}

/**
 * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
 * images to fit into a certain area.

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
// High-res map rendering
function generateMap() {

    //Disable buttons until objects are loaded
    $('#social').hide();
    $('#loading_social').show();
    document.getElementById('snap').classList.add('disabled');
    document.getElementById('download_viz').classList.add('disabled');
    document.getElementById('img_share_url').classList.add('disabled');
    //document.getElementById('order_viz').classList.add('disabled');
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
    var width = 10;
    var height = 8;
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
    img.height = 200;
    img.src = "/static/img/loading.gif";
    snapshot.appendChild(img);
    $("#snapshot_img").addClass("center-block");
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
        if (document.getElementById("VizType").value == "heat-line") {
            linestring_src = new mapboxgl.GeoJSONSource({
                data: stravaLineGeoJson,
                maxzoom: 20,
                buffer: 1000,
                tolerance: 1
            });
            renderMap.addSource('linestring', linestring_src);
            renderMap.addLayer(lineHeatStyle);
            paintLayer(renderMap,
                document.getElementById("line_color").value,
                parseFloat($('#line_width').slider('getValue')),
                parseFloat($('#line_opacity').slider('getValue')),
                'linestring');
        }
        else if (document.getElementById("VizType").value == "heat-point") {
            heatpoint_src = new mapboxgl.GeoJSONSource({
                data: heatpoint_data,
                maxzoom: 20,
                buffer: 1000,
                tolerance: 1
            });
            renderMap.addSource('heatpoint', heatpoint_src);
            renderMap.batch(function (batch) {
                for (var p = 0; p < layers.length; p++) {
                    batch.addLayer(layers[p]);
                }
            });
            paintCircleLayer(renderMap, 'heatpoints',
                parseFloat($('#minOpacity').slider('getValue')),
                parseFloat($('#radius').slider('getValue')),
                parseFloat($('#blur').slider('getValue')));
        }
    });

    renderMap.once('load', function createImage() {
        //Prevent map from grabbing image before lines are pained on new canvas by waiting 0.5 sec
        setTimeout(function() { 
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
                //put the new image in the div
                snapshot.innerHTML = '';
                snapshot.appendChild(img);
                $("#snapshot_img").addClass("img-responsive center-block");
                //Now create the high rez image and upload it to the server
                if (canvas.toBlob) {
                    canvas.toBlob(
                        function (blob) {
                            // Do something with the blob object,
                            randNum = Math.floor(Math.random() * (1000000 - 100 + 1)) + 100;
                            filename = "ADV_" + ath_name + "_" + randNum + ".jpg";
                            console.log('creating file...');
                            file = new File([blob], filename , {type: "image/jpeg"});
                            console.log('getting file to server...');
                            imgBlob = blob;
                            get_signed_request(file);

                        },
                        'image/jpeg', 0.99
                    );
                }
                else {} 
            } catch (err) {
                console.log(err);
                window.alert("Please try a different browser - only Chrome and Firefox are supported for design ordering and sharing!");
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('snap').classList.remove('disabled');
            }
            renderMap.remove();
            hidden.parentNode.removeChild(hidden);
            Object.defineProperty(window, 'devicePixelRatio', {
                get: function() {
                    return actualPixelRatio
                }
            });
        }, 500);
    });

}
 */
