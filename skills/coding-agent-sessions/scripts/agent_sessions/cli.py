from __future__ import annotations

import argparse
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from .jsonio import dumps
from .scanners import DEFAULT_PLATFORMS, PLATFORM_ALIASES, scan
from .timeparse import date_bound, parse_stamp
from .types import Json, JsonMap, Options, Session

# Modified for OMP: discovery only; see ../../ATTRIBUTION.md and ../../LICENSE.md.


def main() -> int:
    command, opts, rest = _parse()
    sessions = sorted(scan(opts.platforms, opts.roots, opts.workers), key=lambda item: item.created_at or "", reverse=True)
    if command == "list":
        _emit(_list_payload(_filter(sessions, opts), sessions, opts.limit, include_subagents=opts.include_subagents))
        return 0
    if command == "search":
        queries = _queries(opts, rest)
        _emit(_search_payload(_filter(sessions, opts), sessions, queries, opts.limit, opts.workers, include_subagents=opts.include_subagents))
        return 0
    raise SystemExit(f"unknown command: {command}")


def _parse() -> tuple[str, Options, list[str]]:
    parser = argparse.ArgumentParser(description="Discover local coding-agent sessions; no transcript read/get API.", allow_abbrev=False)
    parser.add_argument("command", choices=("list", "find", "search"))
    parser.add_argument("text", nargs="*", help="Search words joined into one query; list ignores positional text")
    parser.add_argument("--query", action="append", default=[], help="Repeat for independent search lanes; overrides positional text")
    parser.add_argument("--platform", action="append", default=[], type=lambda value: value.strip().lower(), choices=sorted(DEFAULT_PLATFORMS | PLATFORM_ALIASES.keys()))
    parser.add_argument("--root", action="append", default=[], type=lambda value: Path(value).expanduser(), help="Additional store root, not a replacement for default roots")
    parser.add_argument("--from", dest="date_from")
    parser.add_argument("--to", dest="date_to")
    parser.add_argument("--cwd", type=str.lower)
    parser.add_argument("--model", type=str.lower)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--workers", type=int, default=_default_workers())
    parser.add_argument("--include-subagents", action="store_true")
    args = parser.parse_intermixed_args()
    if args.limit < 0 or args.workers < 1:
        parser.error("--limit must be nonnegative and --workers must be positive")
    try:
        date_bound(args.date_from)
        date_bound(args.date_to, end=True)
    except (ValueError, OverflowError):
        parser.error("invalid date bound; use YYYY-MM-DD, YYYY-MM, YYYY, today, yesterday, or Nd")
    command = "search" if args.command == "find" else args.command
    if command == "search" and not any(query.strip() for query in (args.query or [" ".join(args.text)])):
        parser.error("search requires a query")
    selected_platforms = frozenset(args.platform) if args.platform else DEFAULT_PLATFORMS
    return command, Options(selected_platforms, tuple(args.root), tuple(args.query), args.date_from, args.date_to, args.cwd, args.model, args.limit, args.workers, args.include_subagents), args.text


def _filter(sessions: list[Session], opts: Options) -> list[Session]:
    start = date_bound(opts.date_from)
    end = date_bound(opts.date_to, end=True)
    result: list[Session] = []
    for item in sessions:
        stamp = parse_stamp(item.created_at)
        if start is not None and stamp is not None and stamp < start:
            continue
        if end is not None and stamp is not None and stamp >= end:
            continue
        if opts.cwd is not None and opts.cwd not in (item.cwd or "").lower():
            continue
        if opts.model is not None and opts.model not in (item.model or "").lower():
            continue
        result.append(item)
    return result


def _child_counts(sessions: list[Session]) -> dict[tuple[str, str], int]:
    counts: dict[tuple[str, str], int] = {}
    for item in sessions:
        if item.parent_id is not None:
            key = (item.platform, item.parent_id)
            counts[key] = counts.get(key, 0) + 1
    return counts


def _annotate(item: Session, counts: dict[tuple[str, str], int]) -> JsonMap:
    data = item.to_json()
    data["subagent_count"] = counts.get((item.platform, item.id), 0)
    return data


def _list_payload(filtered: list[Session], all_sessions: list[Session], limit: int, include_subagents: bool = False) -> JsonMap:
    counts = _child_counts(all_sessions)
    candidates = filtered if include_subagents else [item for item in filtered if item.parent_id is None]
    results: list[Json] = [_annotate(item, counts) for item in candidates[:limit]]
    return {"count": len(results), "results": results}


def _search_payload(filtered: list[Session], all_sessions: list[Session], queries: tuple[str, ...], limit: int, workers: int, include_subagents: bool = False) -> JsonMap:
    counts = _child_counts(all_sessions)
    candidates = filtered if include_subagents else [item for item in filtered if item.parent_id is None]
    per_query: list[Json] = []
    merged: dict[tuple[str, str], tuple[Session, list[JsonMap]]] = {}
    with ThreadPoolExecutor(max_workers=min(workers, max(len(queries), 1))) as pool:
        futures = [pool.submit(_search_one, candidates, query, limit) for query in queries]
        for future in as_completed(futures):
            query, matches = future.result()
            per_query.append({"query": query, "count": len(matches), "results": [_annotate_search(item, counts, reasons) for item, reasons in matches]})
            for item, reasons in matches:
                key = (item.platform, item.id)
                if key not in merged:
                    merged[key] = (item, reasons)
    results: list[Json] = [_annotate_search(item, counts, reasons) for item, reasons in list(merged.values())[:limit]]
    return {"count": len(results), "queries": per_query, "results": results}


def _annotate_search(item: Session, counts: dict[tuple[str, str], int], reasons: list[JsonMap]) -> JsonMap:
    data = _annotate(item, counts)
    reason_rows: list[Json] = []
    reason_rows.extend(reasons)
    data["match_reasons"] = reason_rows
    return data


def _match_reasons(item: Session, query: str) -> list[JsonMap]:
    needle = query.lower()
    reasons: list[JsonMap] = []
    for field, value in _search_fields(item):
        if needle in value.lower():
            reasons.append({"query": query, "platform": item.platform, "field": field, "snippet": _snippet(value, needle)})
    if not reasons:
        prompt = next((message for message in item.user_messages or () if needle in message.lower()), "")
        if prompt:
            reasons.append({"query": query, "platform": item.platform, "field": "user_message", "snippet": _snippet(prompt, needle)})
    return reasons


def _search_fields(item: Session) -> tuple[tuple[str, str], ...]:
    return (
        ("platform", item.platform),
        ("id", item.id),
        ("path", item.path),
        ("cwd", item.cwd or ""),
        ("provider", item.provider or ""),
        ("model", item.model or ""),
        ("agent", item.agent or ""),
        ("first_user_message", item.first_user_message),
        ("last_user_message", item.last_user_message),
    )


def _snippet(value: str, needle: str) -> str:
    start = max(value.lower().find(needle) - 60, 0)
    end = min(start + 160, len(value))
    return value[start:end]


def _queries(opts: Options, rest: list[str]) -> tuple[str, ...]:
    if opts.queries:
        return opts.queries
    joined = " ".join(rest).strip()
    return (joined,) if joined else ()


def _search_one(sessions: list[Session], query: str, limit: int) -> tuple[str, list[tuple[Session, list[JsonMap]]]]:
    matches: list[tuple[Session, list[JsonMap]]] = []
    for item in sessions:
        reasons = _match_reasons(item, query)
        if reasons:
            matches.append((item, reasons))
    return query, matches[:limit]


def _emit(value: JsonMap) -> None:
    print(dumps(value))


def _default_workers() -> int:
    cpu = os.cpu_count() or 4
    return min(max(cpu * 4, 8), 64)


if __name__ == "__main__":
    raise SystemExit(main())
