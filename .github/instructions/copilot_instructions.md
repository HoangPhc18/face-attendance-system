# General Copilot Instructions

## Language
- Always **respond in Vietnamese** when generating or explaining code.
- If unsure, ask the user instead of making assumptions.

## Style
- Provide clear, easy-to-understand explanations suitable for intermediate-level developers.
- If including code samples, **always write the complete snippet** (do not leave it incomplete).
- Add brief comments to each code section whenever possible.

## Expected Behavior
- Do **not** automatically generate code unrelated to the current folder/project scope.
- Prioritize using technologies and architecture described in existing instruction files.
- If there are errors or unclear requirements, ask the user to clarify before proceeding.

## Development Principles
- The project should be **suitable for educational and research purposes**.
- Code must be **easy to debug**, using clear logging, modular structure, and meaningful error messages.
- Solutions should be **easy to deploy on free-tier platforms** (e.g., GitHub Pages, Vercel, Firebase, Railway, etc.).
- Prioritize **simplicity and maintainability** — prefer clear and explicit code over clever but obscure solutions.
- Architecture and technology choices should help reduce maintenance costs and make it easy for others to contribute or improve later.

## Extension
- Allow the user (project owner) to add new rules at any time.
- When identifying new instructions or modules without a corresponding file, suggest creating a `.md` file in `.github/instructions/`.
