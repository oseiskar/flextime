// note: this is file is public and depoyed with the app

var ENV = (function(current_host){
    var envs = {
        dev: {
            firebase: "https://flextime-staging.firebaseio.com",
            login_provider: "anonymous",
            auto_login: false
        },
        production: {
            firebase: "https://flextime.firebaseio.com",
            login_provider: "github"
        }
    };

    var by_host = {
        'localhost': envs.dev,
        'flextime-staging.firebaseiapp.com': envs.dev,
        'flextime.firebaseapp.com': envs.production
    };

    if (by_host[current_host]) return by_host[current_host];
    return envs.dev; // fallback env

})(window.location.hostname);
