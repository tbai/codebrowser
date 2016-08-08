var path = require("path");

exports.SERVER_PORT = process.env.PORT || 3000;

exports.MONGODB_CONNECTION_STR = "mongodb://localhost/codebrowser";

exports.DEFAULT_REPOSITORY_NAME = "cooktem";

exports.SCAN_FILES = [
    ".json", ".js", ".ts", ".ejs",
    ".css", ".scss", ".cs", ".less",
    ".java", ".groovy", ".jsp", ".gsp", ".properties",
    ".xml", ".xsd",
    ".config"
];

exports.ADMIN_EMAIL = "tiagoxbai@gmail.com";
exports.appTitle = "Tiago Bai - Code Browser";

exports.SSH_OPTIONS = {
    key: '/opt/git/CodeBrowser/ssl/server.key'
    , cert: '/opt/git/CodeBrowser/ssl/server.crt'
}

exports.AUTH_LDAP_URL = null;

// exports.ACTIVATE_AUTHENTICATION = (process.env.DISABLE_AUTH == "true") ? false : true;
exports.ACTIVATE_AUTHENTICATION = false;

console.log("Using config:\n" + JSON.stringify(exports) + "\n");
