import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Lists directories only (never files) so this stays a pure project-root
// picker. This runs with the same filesystem access as the Node process
// hosting crush-web — which, on a machine also running `crush serve`, is
// no more access than the agent itself already has. Same trust model as
// the rest of the app (see README: treat this like a bare crush serve
// port, fine on localhost, not for public exposure as-is).

interface Entry {
  name: string;
  path: string;
}

async function listDrivesWindows(): Promise<Entry[]> {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const drives: Entry[] = [];
  await Promise.all(
    letters.map(async (letter) => {
      const drivePath = `${letter}:\\`;
      try {
        await fs.stat(drivePath);
        drives.push({ name: drivePath, path: drivePath });
      } catch {
        // drive letter doesn't exist, skip
      }
    }),
  );
  return drives;
}

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("path");

  // No path -> return "roots": quick-access shortcuts plus (on Windows)
  // available drive letters, since there's no single filesystem root.
  if (!requested) {
    const home = os.homedir();
    const shortcuts: Entry[] = [{ name: "Home", path: home }];
    for (const sub of ["Desktop", "Documents", "Downloads"]) {
      const p = path.join(home, sub);
      try {
        await fs.stat(p);
        shortcuts.push({ name: sub, path: p });
      } catch {
        /* doesn't exist, skip */
      }
    }
    const drives = process.platform === "win32" ? await listDrivesWindows() : [];
    return NextResponse.json({ path: null, parent: null, shortcuts, entries: drives });
  }

  const target = path.resolve(requested);

  let dirents;
  try {
    dirents = await fs.readdir(target, { withFileTypes: true });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : `Could not read ${target}` },
      { status: 400 },
    );
  }

  const entries: Entry[] = dirents
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, path: path.join(target, d.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const parent = path.dirname(target);
  const atRoot = parent === target; // dirname("/") === "/", dirname("C:\\") === "C:\\"

  return NextResponse.json({
    path: target,
    parent: atRoot ? null : parent,
    shortcuts: [],
    entries,
  });
}
