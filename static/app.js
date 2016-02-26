(function () {
    var path = window.location.hash.length > 0 && window.location.hash[0] === '#' ? window.location.hash.substring(1) : window.location.hash;
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
                path = window.location.hash.length > 0 && window.location.hash[0] === '#' ? window.location.hash.substring(1) : window.location.hash;
            }
            else if (window.location.search.length > 0) {
                alert('You need to login via Twitch in order to use this panel.');
                window.location.href = "https://ohbot.3v.fi/";
            }
            else {
                window.location.href = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=mndzi8dvtaknz32t2op18x0fcq71lm&redirect_uri=" + encodeURIComponent("https://ohbot.3v.fi/panel/") + "&scope=&state=" + encodeURIComponent(path);
            }
        }
        else {
            var username = localStorage.getItem('username');
        }
        
        if (username && apiToken) {
            authHeader = apiToken;
        }
        
        apiRequest('token', null, function () {
            try {
                var json = JSON.parse(this.responseText);
            }
            catch (e) {
                console.error(e);
                return;
            }

            if (json.status === 200) {
                startApp(json.auth.username, json.auth.token);
            }
            else if (json.status === 205) {
                if (hasStorageSupport) {
                    localStorage.removeItem('username');
                    localStorage.removeItem('apitoken');
                    window.location.reload();
                }
            }
            else {
                console.error("Token status " + this.responseText);
            }
        });
    }
    
    function addToNav(href, text) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        li.appendChild(a);
        document.getElementById('nav').appendChild(li);
    }
    
    function startApp(username, apiToken) {
        authHeader = apiToken;
        if (hasStorageSupport) {
            localStorage.setItem('username', username);
            localStorage.setItem('apitoken', apiToken);
        }
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
            if (hasStorageSupport) {
                localStorage.removeItem('apitoken');
            }
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

        if (data && data.data) {
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', authHeader);
            xhr.send(JSON.stringify(data.data));
        }
        else {
            var verb = "GET";
            if (data && data.verb) {
                verb = data.verb
            }
            xhr.open(verb, url, true);
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