#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
西典排课系统 — 离线激活码生成器（仅管理员使用，勿随软件分发）

用法:
  python3 generate_license.py
  python3 generate_license.py A3F2-8B1C-9D4E-7F06

算法与 license/pakeplus_license.rs 中的 SECRET 必须保持一致。
修改密钥时，请同时改 Python 脚本与 Rust 文件，并重新打包软件。
"""

from __future__ import annotations

import hmac
import hashlib
import re
import sys

# 与 pakeplus_license.rs 中 LICENSE_SECRET 保持一致
LICENSE_SECRET = b"XidianSchedule-L1-x8k2m9p4q7w3n6r"


def normalize_machine_id(raw: str) -> str:
    return re.sub(r"[^0-9A-Fa-f]", "", raw.strip()).upper()


def compute_license(machine_id: str) -> str:
    mid = normalize_machine_id(machine_id)
    if len(mid) != 16:
        raise ValueError(f"机器码格式错误（需 16 位十六进制），当前: {mid!r}")
    digest = hmac.new(LICENSE_SECRET, mid.encode("utf-8"), hashlib.sha256).digest()
    hex_str = digest[:8].hex().upper()
    return "-".join(hex_str[i : i + 4] for i in range(0, 16, 4))


def main() -> None:
    print("=" * 50)
    print("  西典排课系统 · 离线激活码生成器")
    print("=" * 50)
    print()

    if len(sys.argv) > 1:
        machine_id = sys.argv[1]
    else:
        machine_id = input("请输入用户发来的机器码: ").strip()

    try:
        license_code = compute_license(machine_id)
    except ValueError as e:
        print(f"错误: {e}")
        sys.exit(1)

    print()
    print(f"机器码: {normalize_machine_id(machine_id)}")
    print(f"激活码: {license_code}")
    print()
    print("请将激活码发给用户，在软件中输入即可（单机离线，无需联网）。")


if __name__ == "__main__":
    main()
