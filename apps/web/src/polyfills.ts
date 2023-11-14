import "core-js/stable";
require("zone.js/dist/zone");

if (process.env.NODE_ENV === "production") {
  // Production
} else {
  // Development and test
  Error["stackTraceLimit"] = Infinity;
  require("zone.js/dist/long-stack-trace-zone");
}
