const { describe, it } = require("node:test");
const assert = require("node:assert");

const permission = require("../src/permission");
const { buildElicitationUpdatedInput } = permission.__test;

describe("elicitation updated input builder", () => {
  it("echoes original questions and attaches normalized answers", () => {
    const input = {
      questions: [
        {
          question: "Which framework?",
          header: "Framework",
          options: [
            { label: "React", description: "Use React components" },
            { label: "Vue", description: "Use Vue components" },
          ],
        },
        {
          question: "Which platforms?",
          header: "Platforms",
          multiSelect: true,
          options: [
            { label: "macOS", description: "Desktop app support" },
            { label: "Linux", description: "Server support" },
          ],
        },
      ],
      extraField: "keep-me",
    };

    const updatedInput = buildElicitationUpdatedInput(input, {
      "Which framework?": " React ",
      "Which platforms?": "macOS, Linux",
    });

    assert.deepStrictEqual(updatedInput, {
      questions: input.questions,
      extraField: "keep-me",
      answers: {
        "Which framework?": "React",
        "Which platforms?": "macOS, Linux",
      },
    });
  });

  it("drops unknown or blank answers", () => {
    const input = {
      questions: [
        { question: "Proceed?", options: [{ label: "Yes" }, { label: "No" }] },
      ],
      mode: "prompt",
    };

    const updatedInput = buildElicitationUpdatedInput(input, {
      "Proceed?": "   ",
      "Unexpected question": "Yes",
    });

    assert.deepStrictEqual(updatedInput, {
      questions: input.questions,
      mode: "prompt",
      answers: {},
    });
  });
});
