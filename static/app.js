(function () {
    var path = window.location.hash;
    var hasStorageSupport = false;
    var authHeader = "";
    
    window.onload = function () {
        // Check localStorage support
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            hasStorageSupport = true;
        }
        catch (e) { }

        var apiToken;

        // Get credentials
        if (!hasStorageSupport || null === (apiToken = localStorage.getItem('apitoken'))) {
            var qs = parseQueryString(path);
            console.log(qs);
            if ('access_token' in qs) {
                authHeader = "OAuth " + qs['access_token'];
                window.location.hash = 'state' in qs ? qs['state'] : '';
                path = window.location.hash;
            }
            else {
                //window.location.href = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=mndzi8dvtaknz32t2op18x0fcq71lm&redirect_uri=" + encodeURIComponent("https://ohbot.3v.fi/panel/") + "&scope=&state=" + encodeURIComponent(path);
            }
        }
        
        if (apiToken) {
            startApp(apiToken);
        }
        else {
            apiRequest('token', null, function () {
                try {
                    var json = JSON.parse(this.responseText);
                }
                catch (e) {
                    console.error(e);
                    return;
                }

                if (json.status === 200) {
                    startApp(json.token);
                }
                else {
                    console.error("Token status " + json.status);
                }
            });
        }
    }
    
    function startApp(apiToken) {
        authHeader = apiToken;
        apiRequest('me', null, function () {
            try {
                var channelData = JSON.parse(this.responseText);
            }
            catch (e) {
                console.error("couldn't parse me response");
                return;
            }
            initializeChannel(channelData);
        }, function (e) {
            console.log(this, e);
        });
    }
    
    function initializeChannel(channelData) {
        console.log(channelData);
    }

    function apiRequest(endpoint, data, callback, error) {
        var url = "https://ohbot.3v.fi/api/v1/" + endpoint;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', callback);
        if (typeof error === "function") xhr.addEventListener('error', error);

        if (data) {
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', authHeader);
            xhr.send(JSON.stringify(data));
        }
        else {
            xhr.open("GET", url, true);
            xhr.setRequestHeader('Authorization', authHeader);
            xhr.send();
        }
    }

    function parseQueryString(qs) {
        var parts = qs.split('&');
        var values = {};
        for (var i = 0; i < parts.length; ++i) {
            var keyval = parts[i].split('=');
            if (keyval.length > 1) {
                values[decodeURIComponent(keyval[0])] = decodeURIComponent(keyval[1]);
            }
            else {
                values[decodeURIComponent(keyval[0])] = true;
            }
        }
        return values;
    }
})();