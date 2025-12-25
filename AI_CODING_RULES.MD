# THE 12 RULES FOR AI-READABLE CODE = FOLLOW THIS WHILE WRITING CODE

1. START EVERYTHING WITH "WHY"
Before any code, write one sentence explaining what it does and why it exists. No purpose statement means AI will misunderstand your intent.

2. DESIGN FOR AI'S SHORT ATTENTION SPAN
Assume AI only sees 100 lines at once. Put the most important stuff first. Core logic upfront, details later. Make every file self-explanatory in its opening section.

3. REPEAT PATTERNS, DON'T ABSTRACT THEM
Three similar functions are better than one clever abstract function when working with AI. AI recognizes patterns it's seen before. It struggles with unique abstractions.

4. DECLARE DEPENDENCIES LOUD AND CLEAR
Never hide what your code depends on. List external services, libraries, and connections right where they're used. AI needs to know system boundaries.

5. MAKE STATE CHANGES OBVIOUS
Show your state transitions like a flowchart in comments. If something can change from A to B to C, write it out. Hidden state changes break AI's understanding.

6. CHOOSE CLARITY OVER CLEVERNESS
Replace smart one-liners with clear multi-line logic. Write code like you're explaining it to a junior developer. AI follows explicit steps better than implicit magic.

7. DOCUMENT CONSTRAINTS BESIDE THE CODE
Performance limits, scaling needs, business rules – write them right next to where they matter. AI can't read your mind about why you made certain choices.

8. ERRORS SHOULD TELL THE WHOLE STORY
Every error should explain: what broke, where it happened, and how to trace it back. Don't just throw generic exceptions. Give AI enough context to suggest fixes.

9. STICK TO ONE SET OF WORDS
Pick one term per concept and use it everywhere. If you call it a "user" in one place, don't call it a "client" elsewhere unless they're truly different things.

10. KEEP THE FLOW STRAIGHTFORWARD
Write linear, predictable code paths. Avoid deep callbacks, complex event chains, or tricky inheritance. AI follows straight lines better than mazes.

11. MARK MAJOR CHANGES CLEARLY
When you change how something works, leave a note about what changed and why. AI needs to understand both the old way and new way to reason about the codebase.

12. REVIEW CODE FOR AI READABILITY
Do two reviews: one for bugs, one for AI clarity. Ask: "Could AI understand this with minimal context?" If not, simplify.

THE CORE PRINCIPLE:
You're not just writing code anymore.
You're creating a machine-readable knowledge base that needs to work for both computers and AI assistants.

Old priorities: elegant, clever, minimal code
New priorities: clear, predictable, explicit code

QUICK CHECKLIST:
Does every component explain its purpose?

Could AI understand this with only 100 lines of context?

Are we repeating patterns instead of over-abstracting?

Are dependencies obvious?

Is state management explicit?

Have we traded cleverness for clarity?

Are constraints documented?

Do errors provide full context?

Are we using consistent terminology?

Is the code flow straightforward?

Are major changes marked?

Would AI find this code predictable?

This is modern engineering for the AI era.
Good code runs. Great code explains itself to both humans and machines.

## THUMB RULE TO FOLLOW

### IMPLEMENTATION MANTRA

When in doubt, be explicit.
When uncertain, document.
When tempted to be clever, be boring.
When designing, think linear.
When evolving, mark the path.
