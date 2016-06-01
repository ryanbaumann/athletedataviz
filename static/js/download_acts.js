    function start_long_task() {
        // add task status elements
        document.getElementById('dl_data_btn').classList.add('disabled');
        div = $('<div class="progress"><div></div><div>0%</div></div>');
        div2 = $('<div id="status" class="text-center"></div>')
        $('#progress').append(div).append(div2);

        // create a progress bar
        var nanobar = new Nanobar({
            bg: '#44f',
            target: div[0].childNodes[0]
        });
        var params = {
            startDate: document.getElementById("startDate").value,
            endDate: document.getElementById("endDate").value,
            act_limit: 500
        };
        // send ajax POST request to start background job
        $.ajax({
            type: 'POST',
            url: '/longtask',
            data: JSON.stringify(params),
            contentType: 'application/json;charset=UTF-8',
            success: function(data, status, request) {
                status_url = request.getResponseHeader('Location');
                update_progress(status_url, nanobar, div[0]);
            },
            error: function() {
                alert('Unexpected error');
            }
        });
    }

    function update_progress(status_url, nanobar, status_div) {
        // send GET request to status URL

        $.getJSON(status_url, function(data) {
            // update UI
            percent = parseInt(data['current'] * 100 / data['total']);
            nanobar.go(percent);
            $(status_div.childNodes[1]).text(percent + '%');
            $(status_div.childNodes[2]).text(data['status']);
            if (data['state'] != 'PENDING' && data['state'] != 'PROGRESS') {
                if ('result' in data) {
                    // show result
                    $(status_div.childNodes[3]).text('Result: ' + data['result']);
                    $('#status').html("<strong> Result: "+data['result']+"</strong>");
                    document.getElementById("dl_data_btn").classList.remove("disabled")
                } else {
                    // something unexpected happened
                    $(status_div.childNodes[3]).text('Result: ' + data['state']);
                    $('#status').html("<strong> Result: "+data['state']+"</strong>");
                }
            } else {
                // rerun in 2.5 seconds
                setTimeout(function() {
                    update_progress(status_url, nanobar, status_div);
                    $('#status').html("<strong>"+data['status']+"</strong>");
                    get_acts();
                }, 2500);
            }
        });
    }