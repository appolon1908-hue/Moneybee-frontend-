#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    compose = Path("deploy/compose.frontend.yml").read_text(encoding="utf-8")
    dockerfile = Path("Dockerfile").read_text(encoding="utf-8")
    failures: list[str] = []
    if "build:" in compose:
        failures.append("frontend runtime Compose contains a build context")
    for service in ("marketing", "borrower", "lender", "admin"):
        if f"MONEYBEE_{service.upper()}_IMAGE" not in compose:
            failures.append(f"missing digest variable for {service}")
    if "pnpm install --frozen-lockfile" not in dockerfile:
        failures.append("Dockerfile does not enforce frozen lockfile")
    if "Moneybee-Backend" in compose or "Moneybee-Backend" in dockerfile:
        failures.append("frontend Docker assets reference backend source")
    if failures:
        print("FRONTEND_SCAFFOLD=FAIL", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print("FRONTEND_SCAFFOLD=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
