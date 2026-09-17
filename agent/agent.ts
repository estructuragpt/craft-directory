import { defineAgent } from "eve";

// Production model selection is a deployment decision. Keep this static so Eve can compile it.
export default defineAgent({ name: "craft-directory-assistant", model: "openai/gpt-5.4-mini" });
