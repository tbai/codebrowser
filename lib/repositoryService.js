var http = require("http")
    , fs = require("fs")
    , path = require('path')
    , config = require("../config")
    , db = require("../models/db")
    , exec = require('child_process').exec;


var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

// configure the app to use the repository objects
exports.configure = function (app) {
    app.param('repository', function (req, res, next, repoName) {
        db.Repository.findOne({ name: repoName }, function (err, repo) {
            if (!err && repo) {
                console.info("Loaded repository param: " + repoName)
                req.session.repository = repo.id;
                res.locals.repository = repo.id;
                next();
            } else {
                console.warn("Failed to load repository: " + repoName + " err=" + err);
                next();
            }
        });
    });

    // locals - to be used in views
    app.use(function (req, res, next) {
        res.locals.repository = exports.getCurrentRepositoryId(req);
        next();
    });
}



// get current repository
exports.getCurrentRepositoryId = function (req) {
    if (req.param && req.param("repository") && req.param("repository") != "null"){
      return req.param("repository");
    } else if (req.session && req.session.repository){
      return req.session.repository;
    } else {
      return null;
    }
}


// scan all files from the repositories and save them to mongo
exports.scanAll = function () {
    console.log("Scan all");

    function scanRepositoryFn(repo) {
        return scan(repo).then(() => {
            return new Promise(resolve => {
                // save last updated
                repo.lastUpdated = new Date();
                repo.save(function () {
                    resolve();
                });
            })
        });
    }


    return new Promise((resolve, reject) => {
        db.Repository.find(function (error, repoList) {
            if (error) {
                reject(error);
                return;
            }
            let p = Promise.resolve();

            repoList.forEach(repo => {
                p = p.then(() => scanRepositoryFn(repo));
            });

            p.then(resolve);
        });
    });

} // scanAll


// scan one repository
function scan(repository) {
    console.log("scan", repository.name, repository.id);

    var scanPromises = [];

    for (var i = 0; i < repository.scanfolders.length; i++) {
        console.log("ScanFolder: " + repository.scanfolders[i]);
        scanPromises.push(
            scanFolder(repository, path.join(repository.path, repository.scanfolders[i]))
        );
    }

    console.log("Scanning repository " + repository.name);

    return Promise.all(scanPromises).then(() => {
        console.log("Scan complete...")
        console.log("Removing deleted files...");
        return clearDeletedFiles(repository);
    });
}

exports.scan = scan


// Mongodb operation to save or update a file
function createOrUpdateFile(data, mtime) {
    return new Promise((resolve, reject) => {
        db.File.findOne({ fullpath: data.fullpath, _repository: data._repository }, function (error, file) {
            if (error) reject(error);

            if (!file) {
                console.log("creating: " + data.fullpath);
                file = new db.File(data);
                file.save(resolve);
            } else if (mtime && mtime >= file.lastUpdated) {
                console.log("updating: " + data.fullpath);
                file.text = data.text;
                file.history = null;
                file.lastUpdated = mtime;
                file.save(resolve);
            } else {
                resolve();
            }
        });
    });
}


// return file data object to be used in save operation
function getFileData(repository, filePath) {
    var ext = path.extname(filePath);

    var encoding = "utf8";
    // if (ext === ".json")
    //     encoding = "utf-16le";

    var normalizedRepoPath = path.normalize(repository.path);

    // do the magic
    return {
        fullpath: unixFormat(filePath)
        , displaypath: unixFormat(
            repository.name + "/" + filePath.substring(filePath.indexOf(normalizedRepoPath) + normalizedRepoPath.length + 1)
        )
        , _repository: repository._id
        , basename: path.basename(filePath)
        , extension: ext
        , text: fs.readFileSync(filePath, { encoding: encoding })
    };
}


// convert file path to always have unix format in the database
function unixFormat(filepath) {
    return filepath.split(path.sep).join("/");
}


// Scan folder recursively
function scanFolder(repo, folderPath) {
    console.log("scanFolder", repo.name, folderPath);

    // check the ignore list
    for (let i = 0; i < repo.ignoreFolders.length; i++) {
        if (folderPath.indexOf(path.join(repo.path, repo.ignoreFolders[i])) >= 0) {
            return Promise.resolve("ignored");
        }
    }

    let promiseList = [];

    let files = fs.readdirSync(folderPath);
    if (!files) return Promise.resolve();

    let filePath, stat, ext, i;
    for (i = 0; i < files.length; i++) {
        if (files[i][0] == ".") continue;

        filePath = path.resolve(folderPath, files[i]);
        stat = fs.statSync(filePath);

        // read folder
        if (stat.isDirectory()) {
            promiseList.push(scanFolder(repo, filePath));

            // read file
        } else {

            ext = path.extname(filePath);
            // read only valid files
            if (config.SCAN_FILES.indexOf(ext) === -1) continue;

            let data = getFileData(repo, filePath);
            let p = createOrUpdateFile(data, stat.mtime);
            promiseList.push(p);
        }

        filePath = stat = ext = null;
    }

    return Promise.all(promiseList);

} // scanFolder



// Remove the deleted files from database
function clearDeletedFiles(repo) {
    // check all files to see if some of them were removed from the repository
    var q, skip = 0, limit = 100, count = 0;
    q = db.File.find({ _repository: repo._id });


    function clearDeletedFilesCB() {

        var promiseList = [];

        q.skip(skip).limit(limit).exec((err, list) => {
            if (err || list.length == 0)
                return Promise.resolve();

            var filepath, file;
            for (var i = 0; i < list.length; i++) {
                file = list[i];
                filepath = path.resolve(repo.path, file.fullpath)
                if (!fs.existsSync(filepath)) {
                    // remove from mongodb
                    console.log("Removing from DB: " + filepath);
                    promiseList.push(Promise.resolve(file).then(f => {
                        return new Promise(localResolve => f.remove(localResolve));
                    }));
                }
            }

            skip += limit;
            return Promise.all(promiseList).then(() => clearDeletedFilesCB())

        });

    }

    return clearDeletedFilesCB();
}


/**
 * settings: {
        name: "all"
        , path: "/opt/git"
        , scanfolders: [
            "codebrowser"
            , "algorithms"
            , "cooktem"
        ]
        , ignoreFolders: [
            "libs"
        ]
    }
 */
exports.createRepository = function (settings) {
    var repository = new db.Repository(settings);

    repository.save(function (err) {
        if (err) {
            console.error(err)
            process.exit(1);
        } else {
            console.log("Success! Repository id= " + repository._id)
            process.exit(0);
        }
    });
}


// GIT operations
exports.gitUpdateBranch = function (repository, callbackFn) {
    // cd gitfolder && git fetch
    var cmdStr = function (str) {
        console.log("\tcmd: " + str);
        return "cd " + repository.path + " && " + str;
    }
    var cmd = cmdStr("git fetch");
    exec(cmd, function (fetchError, fetchOutput) {
        if (fetchError) {
            console.error(fetchError);
            callbackFn(fetchError);
            return;
        }
        console.log(fetchOutput);

        // rename current branch:
        // git branch -m [branchname]_old
        cmd = cmdStr("git branch -m " + repository.name + "_old");
        exec(cmd, function (renameError, renameOutput) {
            if (renameError) {
                console.error(renameError);
                callbackFn(renameError);
                return;
            }
            console.log(renameOutput);

            // git checkout -b [branchname] [remote branch]
            cmd = cmdStr("git checkout -b " + repository.name + " " + repository.remoteBranch);
            exec(cmd, function (checkoutError, checkoutOutput) {
                if (checkoutError) {
                    console.error(checkoutError);
                    callbackFn(checkoutError);
                    return;
                }
                console.log(checkoutOutput);

                // delete old branch
                cmd = cmdStr("git branch -D " + repository.name + "_old");
                exec(cmd, function (deleteError) {
                    if (deleteError) {
                        console.error(deleteError);
                        callbackFn(deleteError);
                    }
                    callbackFn();
                });
            });
        });
    });
}

// update files using git pull
function gitPull(repository, callbackFn) {
    // cd gitfolder && git fetch
    function cmdStr(str) {
        console.log("\tcmd: " + str);
        return `cd ${repository.path} && ${str}`;
    }
    var cmd = cmdStr("git fetch");
    exec(cmd, function (fetchError, fetchOutput) {
        if (fetchError) {
            console.error(fetchError);
            callbackFn(fetchError);
            return;
        }
        console.log(fetchOutput);

        // rename current branch:
        // git merge -s recursive -X theirs origin/branchname
        cmd = cmdStr(`git merge -s recursive -X theirs ${repository.remoteBranch ? repository.remoteBranch : 'origin/master'}`);
        exec(cmd, function (mergeError, mergeOutput) {
            if (mergeError) {
                console.error(mergeError);
                callbackFn(mergeError);
                return;
            }
            console.log(mergeOutput);
            callbackFn();
        });
    });
}
exports.gitPull = gitPull;


// execute git pull in all repositories
function gitPullAll(callbackFn) {
    var nResolved = 0;
    db.Repository.find(function (error, repoList) {
        if (error) {
            callbackFn(error);
            return;
        }
        for (var i = 0; i < repoList.length; i++) {
            gitPull(repoList[i], function (gitError) {
                nResolved++;
                if (nResolved === repoList.length) {
                    callbackFn();
                }
            });
        }
    });
}
exports.gitPullAll = gitPullAll;
