import test from "node:test";
import assert from "node:assert/strict";
import {
  activeModuleId,
  registerModule,
  resetRouterForTests,
  routeTo,
  updateActive
} from "../src/router.js";

test("route changes run prior module cleanup before mounting the next module", () => {
  resetRouterForTests();
  const events = [];
  const container = { innerHTML: "" };
  const state = {};
  const dispatch = () => {};

  registerModule("first", {
    mount() {
      events.push("first:mount");
      return () => events.push("first:cleanup");
    },
    update() {
      events.push("first:update");
    }
  });
  registerModule("second", {
    mount() {
      events.push("second:mount");
      return () => events.push("second:cleanup");
    },
    update() {
      events.push("second:update");
    }
  });

  routeTo(container, "first", state, dispatch);
  routeTo(container, "second", state, dispatch);

  assert.deepEqual(events, ["first:mount", "first:cleanup", "second:mount"]);
  assert.equal(activeModuleId(), "second");
});

test("routing to the active module updates without cleanup or remount", () => {
  resetRouterForTests();
  const events = [];
  const container = { innerHTML: "" };

  registerModule("stable", {
    mount() {
      events.push("mount");
      return () => events.push("cleanup");
    },
    update() {
      events.push("update");
    }
  });

  routeTo(container, "stable", {}, () => {});
  routeTo(container, "stable", {}, () => {});
  updateActive(container, {});

  assert.deepEqual(events, ["mount", "update", "update"]);
});

test("resetRouterForTests cleans active module resources", () => {
  resetRouterForTests();
  const events = [];
  const container = { innerHTML: "" };

  registerModule("owned", {
    mount() {
      events.push("mount");
      return () => events.push("cleanup");
    }
  });

  routeTo(container, "owned", {}, () => {});
  resetRouterForTests();

  assert.deepEqual(events, ["mount", "cleanup"]);
  assert.equal(activeModuleId(), null);
});
