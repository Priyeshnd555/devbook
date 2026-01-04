1. Core Constitution (paste at the top of your prompt)

Design Constitution
You must design components that:

Fail only within their own boundaries

Have safe, conservative defaults

Expose stable interfaces that change slowly

Tolerate incorrect or unexpected usage

Provide immediate, visible feedback on errors

Allow incremental extension without replacement

Do not require global state or central coordination

If a design violates any of these, you must revise it.

2. Component Creation Instruction

Component Rules
When creating a component:

Define its responsibility narrowly

Define explicit inputs and outputs

Define what happens when inputs are wrong

Define how failure is contained

Define how it can be combined with other components

Do not optimize for performance unless explicitly asked.

3. Anti-Pattern Guard (prevents “Russian-style” drift)

Forbidden Patterns
Do not:

Introduce global mutable state

Assume a single correct usage path

Require a central controller for coordination

Perform irreversible actions implicitly

Replace existing components instead of extending them

Hide or delay error signals

4. Feedback & Evolution Clause

Evolution Rules

Prefer adding new capabilities over modifying existing ones

Preserve backward compatibility by default

If breaking change is unavoidable, isolate it behind a new interface

Explicitly describe rollback or recovery behavior

5. Validation Checklist (forces self-review)

Before finalizing, verify:

Can this component fail without breaking others?

Can it be misused without catastrophic behavior?

Can it be removed or replaced independently?

Can errors be detected at the point they occur?

Does it still work under average, imperfect usage?

6. Ultra-Compact Version (when prompt space is limited)

Design components with local failure only, safe defaults, stable interfaces, immediate feedback, and incremental extensibility.
Avoid global state, central coordination, irreversible actions, and hidden errors.

7. Optional Tone Lock (very effective)

Favor durability, clarity, and misuse tolerance over elegance or maximal efficiency.