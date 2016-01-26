// note: this is file is public and depoyed with the app

var ENV = (function(current_host){
    var envs = {
        dev: {
            firebase: "https://liukuma-staging.firebaseio.com",
            login_provider: "anonymous"
        },
        production: {
            firebase: "https://liukuma.firebaseio.com",
            login_provider: "anonymous"
        }
    };

    var by_host = {
        'localhost': envs.dev,
        'liukuma-staging.firebaseio.com': envs.dev,
        'liukuma.firebaseio.com': envs.production
    };

    if (by_host[current_host]) return by_host[current_host];
    return envs.dev; // fallback env

})(window.location.hostname);
