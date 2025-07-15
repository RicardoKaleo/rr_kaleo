"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/isows";
exports.ids = ["vendor-chunks/isows"];
exports.modules = {

/***/ "(ssr)/./node_modules/isows/_esm/index.js":
/*!******************************************!*\
  !*** ./node_modules/isows/_esm/index.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   WebSocket: () => (/* binding */ WebSocket)\n/* harmony export */ });\n/* harmony import */ var ws__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ws */ \"(ssr)/./node_modules/ws/wrapper.mjs\");\n/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ \"(ssr)/./node_modules/isows/_esm/utils.js\");\n\r\n\r\nconst WebSocket = (() => {\r\n    try {\r\n        return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.getNativeWebSocket)();\r\n    }\r\n    catch {\r\n        if (ws__WEBPACK_IMPORTED_MODULE_0__.WebSocket)\r\n            return ws__WEBPACK_IMPORTED_MODULE_0__.WebSocket;\r\n        return ws__WEBPACK_IMPORTED_MODULE_0__;\r\n    }\r\n})();\r\n//# sourceMappingURL=index.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXNvd3MvX2VzbS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBaUM7QUFDZTtBQUN6QztBQUNQO0FBQ0EsZUFBZSw2REFBa0I7QUFDakM7QUFDQTtBQUNBLFlBQVkseUNBQW9CO0FBQ2hDLG1CQUFtQix5Q0FBb0I7QUFDdkMsZUFBZSwrQkFBVTtBQUN6QjtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL3JldmVyc2UtcmVjcnVpdGluZy1zYWFzLy4vbm9kZV9tb2R1bGVzL2lzb3dzL19lc20vaW5kZXguanM/ZjdhMyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBXZWJTb2NrZXRfIGZyb20gXCJ3c1wiO1xyXG5pbXBvcnQgeyBnZXROYXRpdmVXZWJTb2NrZXQgfSBmcm9tIFwiLi91dGlscy5qc1wiO1xyXG5leHBvcnQgY29uc3QgV2ViU29ja2V0ID0gKCgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGdldE5hdGl2ZVdlYlNvY2tldCgpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2gge1xyXG4gICAgICAgIGlmIChXZWJTb2NrZXRfLldlYlNvY2tldClcclxuICAgICAgICAgICAgcmV0dXJuIFdlYlNvY2tldF8uV2ViU29ja2V0O1xyXG4gICAgICAgIHJldHVybiBXZWJTb2NrZXRfO1xyXG4gICAgfVxyXG59KSgpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/isows/_esm/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/isows/_esm/utils.js":
/*!******************************************!*\
  !*** ./node_modules/isows/_esm/utils.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getNativeWebSocket: () => (/* binding */ getNativeWebSocket)\n/* harmony export */ });\nfunction getNativeWebSocket() {\r\n    if (typeof WebSocket !== \"undefined\")\r\n        return WebSocket;\r\n    if (typeof global.WebSocket !== \"undefined\")\r\n        return global.WebSocket;\r\n    if (typeof window.WebSocket !== \"undefined\")\r\n        return window.WebSocket;\r\n    if (typeof self.WebSocket !== \"undefined\")\r\n        return self.WebSocket;\r\n    throw new Error(\"`WebSocket` is not supported in this environment\");\r\n}\r\n//# sourceMappingURL=utils.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXNvd3MvX2VzbS91dGlscy5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmV2ZXJzZS1yZWNydWl0aW5nLXNhYXMvLi9ub2RlX21vZHVsZXMvaXNvd3MvX2VzbS91dGlscy5qcz9hODU4Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVXZWJTb2NrZXQoKSB7XHJcbiAgICBpZiAodHlwZW9mIFdlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICByZXR1cm4gV2ViU29ja2V0O1xyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwuV2ViU29ja2V0ICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHJldHVybiBnbG9iYWwuV2ViU29ja2V0O1xyXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cuV2ViU29ja2V0ICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgIHJldHVybiB3aW5kb3cuV2ViU29ja2V0O1xyXG4gICAgaWYgKHR5cGVvZiBzZWxmLldlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICByZXR1cm4gc2VsZi5XZWJTb2NrZXQ7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJgV2ViU29ja2V0YCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZW52aXJvbm1lbnRcIik7XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/isows/_esm/utils.js\n");

/***/ })

};
;