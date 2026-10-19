import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { ADMIN_EMAILS, grantsOwner, isOwnerEmail, ownerAllowList } = await jiti.import(new URL("../src/lib/admin-access.ts", import.meta.url).pathname);

const OWNER = "owner@example.com";
const STUDENT = "student@example.com";
const ALLOW = [OWNER];

test("an allow-list email is the owner, whatever the display name is", () => {
  assert.equal(grantsOwner({ email: "  Owner@Example.com ", name: "Student", allow: ALLOW, userId: "a" }), true);
  assert.equal(isOwnerEmail("OWNER@example.com", ALLOW), true);
});

test("a matching display name does not grant owner access", () => {
  for (const name of ["Adeola", "Crown Ha'Day", "Haday", "Adegbolagun", "adeola student"]) {
    assert.equal(
      grantsOwner({ email: STUDENT, name, allow: ALLOW, userId: "student", firstUserId: "student" }),
      false,
      name,
    );
  }
});

test("the live allow list still contains the owner emails", () => {
  assert.ok(ADMIN_EMAILS.length >= 1);
  for (const email of ADMIN_EMAILS) {
    assert.equal(grantsOwner({ email, name: "Someone Else", allow: ADMIN_EMAILS, userId: "owner" }), true);
    assert.equal(isOwnerEmail(email, ownerAllowList(ADMIN_EMAILS, "")), true);
  }
});

test("an extra host email joins the allow list", () => {
  const allow = ownerAllowList(ADMIN_EMAILS, " Guest@School.edu ");
  assert.equal(grantsOwner({ email: "guest@school.edu", name: "Guest", allow, userId: "g" }), true);
  assert.equal(grantsOwner({ email: STUDENT, name: "Adeola", allow, userId: "s" }), false);
});

test("an empty allow list keeps only the first account, not a named later account", () => {
  assert.equal(grantsOwner({ email: STUDENT, name: "Adeola", allow: [], userId: "first", firstUserId: "first" }), true);
  assert.equal(grantsOwner({ email: STUDENT, name: "Crown", allow: [], userId: "second", firstUserId: "first" }), false);
});
