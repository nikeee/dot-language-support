"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createMapFromTemplate(template) {
    const map = new Map();
    for (const key in template) {
        if (template.hasOwnProperty(key)) {
            map.set(key, template[key]);
        }
    }
    return map;
}
exports.createMapFromTemplate = createMapFromTemplate;
//# sourceMappingURL=core.js.map