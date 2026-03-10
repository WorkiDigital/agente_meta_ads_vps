"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var db_js_1 = require("./db.js");
// Create server instance
var server = new mcp_js_1.McpServer({
    name: "designer-brand-mcp",
    version: "1.0.0",
});
// Resources implementation
server.resource("profile", "designer://profile", function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var db;
    return __generator(this, function (_a) {
        db = (0, db_js_1.readDb)();
        return [2 /*return*/, {
                contents: [{
                        uri: uri.href,
                        text: JSON.stringify(db.profile, null, 2),
                        mimeType: "application/json"
                    }]
            }];
    });
}); });
server.resource("models", "designer://models", function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var db;
    return __generator(this, function (_a) {
        db = (0, db_js_1.readDb)();
        return [2 /*return*/, {
                contents: [{
                        uri: uri.href,
                        text: JSON.stringify(db.modelPosts, null, 2),
                        mimeType: "application/json"
                    }]
            }];
    });
}); });
server.resource("photos", "designer://photos", function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var db;
    return __generator(this, function (_a) {
        db = (0, db_js_1.readDb)();
        return [2 /*return*/, {
                contents: [{
                        uri: uri.href,
                        text: JSON.stringify(db.photos, null, 2),
                        mimeType: "application/json"
                    }]
            }];
    });
}); });
// Tools implementation
server.tool("set_profile", "Set or update your brand profile (tone of voice, niche, etc.)", {
    name: zod_1.z.string().optional().describe("Your brand or persona name"),
    niche: zod_1.z.string().optional().describe("The niche or market you operate in"),
    toneOfVoice: zod_1.z.string().optional().describe("The tone you use (e.g. professional, funny, authoritative)"),
    brandIdentity: zod_1.z.string().optional().describe("Core values or visual identity guidelines"),
    otherDetails: zod_1.z.string().optional().describe("Any other relevant instructions")
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var updated;
    return __generator(this, function (_a) {
        updated = (0, db_js_1.updateProfile)(args);
        return [2 /*return*/, {
                content: [{ type: "text", text: "Profile updated successfully:\n".concat(JSON.stringify(updated, null, 2)) }]
            }];
    });
}); });
server.tool("add_model_post", "Save a reference text or post that perfectly represents your style", {
    content: zod_1.z.string().describe("The exact text of the post"),
    description: zod_1.z.string().describe("What this post is about / why it's a good model")
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var added;
    var content = _b.content, description = _b.description;
    return __generator(this, function (_c) {
        added = (0, db_js_1.addModelPost)(content, description);
        return [2 /*return*/, {
                content: [{ type: "text", text: "Model post added successfully. ID: ".concat(added.id) }]
            }];
    });
}); });
server.tool("add_photo", "Register a photo reference to your designer database", {
    filename: zod_1.z.string().describe("The filename of the image in the current directory"),
    description: zod_1.z.string().describe("A visual description of the photo")
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var added;
    var filename = _b.filename, description = _b.description;
    return __generator(this, function (_c) {
        added = (0, db_js_1.addPhotoReference)(filename, description);
        return [2 /*return*/, {
                content: [{ type: "text", text: "Photo reference added successfully. ID: ".concat(added.id) }]
            }];
    });
}); });
// Prompts implementation
server.prompt("design_post", "Create a new post matching the user's brand identity, tone of voice, using model posts as reference.", {
    topic: zod_1.z.string().describe("The topic for the new post"),
}, function (_a) {
    var topic = _a.topic;
    var db = (0, db_js_1.readDb)();
    // Inject all profile, model posts, and photos context into the prompt
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "Please design a new post about: \"".concat(topic, "\"\n\n") +
                        "### BRAND PROFILE\n".concat(JSON.stringify(db.profile, null, 2), "\n\n") +
                        "### MODEL POSTS TO EMULATE\n".concat(JSON.stringify(db.modelPosts, null, 2), "\n\n") +
                        "### AVAILABLE PHOTOS\n".concat(JSON.stringify(db.photos, null, 2), "\n\n") +
                        "Instructions: Write a new post that sounds exactly like my profile tone of voice, uses the structure of my model posts, and optionally suggests which available photo from my catalog I should use."
                }
            }
        ]
    };
});
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.error("Designer Brand MCP Server running on stdio");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
