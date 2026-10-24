import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { cleanBlogComment, blogCommentName } = await jiti.import(
  new URL("../src/lib/blog-comment-text.ts", import.meta.url).pathname,
);

test("a blank comment is refused", () => {
  assert.equal(cleanBlogComment("   ").ok, false);
});

test("a comment keeps its line breaks and drops a null", () => {
  const result = cleanBlogComment("Aleph\u0000 is silent.\r\nHear it.");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.body, "Aleph is silent.\nHear it.");
});

test("a comment over the limit is refused", () => {
  assert.equal(cleanBlogComment("a".repeat(1501)).ok, false);
});

test("a missing name is Classmate", () => {
  assert.equal(blogCommentName("  "), "Classmate");
  assert.equal(blogCommentName("Ada"), "Ada");
});
