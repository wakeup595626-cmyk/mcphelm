export interface ArgSpec {
  boolean?: string[];
  string?: string[];
  repeat?: string[];
  aliases?: Record<string, string>;
}

export interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string | boolean | string[]>;
  errors: string[];
}

export function parseArgs(argv: string[], spec: ArgSpec = {}): ParsedArgs {
  const flags = new Map<string, string | boolean | string[]>();
  const positionals: string[] = [];
  const errors: string[] = [];
  const boolSet = new Set(spec.boolean ?? []);
  const strSet = new Set(spec.string ?? []);
  const repSet = new Set(spec.repeat ?? []);
  const aliases = spec.aliases ?? {};

  let i = 0;
  while (i < argv.length) {
    const tok = argv[i] as string;
    if (tok === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (tok.startsWith('--') || (tok.startsWith('-') && tok.length === 2)) {
      let name = tok;
      let inline: string | undefined;
      const eq = tok.indexOf('=');
      if (eq !== -1) {
        name = tok.slice(0, eq);
        inline = tok.slice(eq + 1);
      }
      name = aliases[name] ?? name;
      if (boolSet.has(name)) {
        flags.set(name, inline === undefined ? true : inline !== 'false');
      } else if (strSet.has(name) || repSet.has(name)) {
        let value: string;
        if (inline !== undefined) {
          value = inline;
        } else {
          const next = argv[i + 1];
          if (next === undefined) {
            errors.push('missing value for ' + name);
            i++;
            continue;
          }
          value = next;
          i++;
        }
        if (repSet.has(name)) {
          const prev = flags.get(name);
          const arr = Array.isArray(prev) ? (prev as string[]) : [];
          arr.push(value);
          flags.set(name, arr);
        } else {
          flags.set(name, value);
        }
      } else {
        errors.push('unknown flag: ' + tok);
      }
    } else {
      positionals.push(tok);
    }
    i++;
  }
  return { positionals, flags, errors };
}

export function flagString(p: ParsedArgs, name: string): string | undefined {
  const v = p.flags.get(name);
  return typeof v === 'string' ? v : undefined;
}

export function flagBool(p: ParsedArgs, name: string): boolean {
  return p.flags.get(name) === true;
}

export function flagList(p: ParsedArgs, name: string): string[] {
  const v = p.flags.get(name);
  return Array.isArray(v) ? (v as string[]) : [];
}
