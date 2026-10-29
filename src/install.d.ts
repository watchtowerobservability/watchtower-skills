export type Tool = 'claude' | 'cursor' | 'codex' | 'gemini';
export interface Skill { name: string; description: string; body: string; raw: string }
export const TOOLS: Tool[];
export const BEGIN: string;
export const END: string;
export function loadSkills(dir?: string): Skill[];
/** Installs every skill for one tool under dir and returns the files written. Safe to re-run. */
export function install(tool: Tool, dir?: string, skills?: Skill[]): string[];
