"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDb = readDb;
exports.writeDb = writeDb;
exports.updateProfile = updateProfile;
exports.addModelPost = addModelPost;
exports.addPhotoReference = addPhotoReference;
var fs_1 = require("fs");
var path_1 = require("path");
var dbPath = path_1.default.join(__dirname, '..', 'data.json');
var defaultDb = {
    profile: {
        name: "",
        niche: "",
        toneOfVoice: "",
        brandIdentity: "",
        otherDetails: ""
    },
    modelPosts: [],
    photos: []
};
// Initialize DB if it doesn't exist
function initDb() {
    if (!fs_1.default.existsSync(dbPath)) {
        fs_1.default.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    }
}
function readDb() {
    initDb();
    var data = fs_1.default.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}
function writeDb(data) {
    fs_1.default.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
function updateProfile(profileContent) {
    var db = readDb();
    db.profile = __assign(__assign({}, db.profile), profileContent);
    writeDb(db);
    return db.profile;
}
function addModelPost(content, description) {
    var db = readDb();
    var newPost = {
        id: Date.now().toString(),
        content: content,
        description: description,
        addedAt: new Date().toISOString()
    };
    db.modelPosts.push(newPost);
    writeDb(db);
    return newPost;
}
function addPhotoReference(filename, description) {
    var db = readDb();
    var newPhoto = {
        id: Date.now().toString(),
        filename: filename,
        description: description,
        addedAt: new Date().toISOString()
    };
    db.photos.push(newPhoto);
    writeDb(db);
    return newPhoto;
}
