
function get_signed_request(file){
    var datapath = '/sign_s3?file_name='+file.name+"&file_type="+file.type
    var xhr = new XMLHttpRequest();
    xhr.open("GET", datapath);
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                var response = JSON.parse(xhr.responseText);
                upload_file(file, response.signed_request, response.url);
            }
            else{
                alert("Could not get signed URL.");
            }
        }
    };
    xhr.send();
}

//update links
function updateLinks(url) {
    console.log(encodeURIComponent(url))
    var fb_share = 'https://www.facebook.com/sharer/sharer.php?u=' + 
                encodeURIComponent(url);
    var pin_share = 'https://pinterest.com/pin/create/button/?url=url=www.athletedataviz.com&media=' + 
                encodeURIComponent(url) +
                '&description=' + encodeURIComponent('Check out my AthleteDataViz!');
    var twit_share = 'https://twitter.com/home?status=' +
                encodeURIComponent('Check out my AthleteDataViz! ' + url);
    var google_share = 'https://plus.google.com/share?url=' + encodeURIComponent(url);
    var link_share = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(url) +
                '&title=athletedataviz&summary=Check%20out%20my%20AthleteDataViz!&source=www.athletedataviz.com'
    $("#share_fb").attr('href', fb_share);
    $("#share_pin").attr('href', pin_share);
    $("#share_twit").attr('href', twit_share);
    $("#share_gplus").attr('href', google_share);
    $("#share_link").attr('href', link_share);
}

function upload_file(file, signed_request, url){
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", signed_request);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.onload = function() {
        if (xhr.status === 200) {
            $('#download_viz').attr('href', url).
                    attr('download', "ADV_" + ath_name + ".jpg");
            updateLinks(url);
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file.");
    };
    xhr.send(file);
}