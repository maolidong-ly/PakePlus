//! 西典排课系统 — PakePlus / Tauri 一机一码 Rust 命令
//!
//! 【集成步骤】
//! 1. 在 PakePlus 项目的 src-tauri/Cargo.toml 添加依赖:
//!      machine-uid = "0.5"
//!      sha2 = "0.10"
//!      hmac = "0.12"
//!
//! 2. 将本文件内容复制到 src-tauri/src/license.rs，并在 lib.rs 或 main.rs 中:
//!      mod license;
//!      use license::{get_machine_id, verify_license};
//!
//!      .invoke_handler(tauri::generate_handler![
//!          // ...原有命令
//!          get_machine_id,
//!          verify_license,
//!      ])
//!
//! 3. LICENSE_SECRET 必须与 tools/generate_license.py 中 LICENSE_SECRET 完全一致
//! 4. 重新用 PakePlus 打包整个项目
//!
//! 【算法】
//! 机器码 = SHA256(machine-uid) 前 8 字节 → 格式 XXXX-XXXX-XXXX-XXXX
//! 激活码 = HMAC-SHA256(机器码去横线, SECRET) 前 8 字节 → 同上格式

use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};

type HmacSha256 = Hmac<Sha256>;

/// 与 tools/generate_license.py 中 LICENSE_SECRET 保持一致
const LICENSE_SECRET: &[u8] = b"XidianSchedule-L1-x8k2m9p4q7w3n6r";

fn format_code(bytes: &[u8]) -> String {
    let hex: String = bytes.iter().take(8).map(|b| format!("{:02X}", b)).collect();
    format!(
        "{}-{}-{}-{}",
        &hex[0..4],
        &hex[4..8],
        &hex[8..12],
        &hex[12..16]
    )
}

fn normalize_hex(raw: &str) -> String {
    raw.chars()
        .filter(|c| c.is_ascii_hexdigit())
        .collect::<String>()
        .to_uppercase()
}

fn raw_machine_id() -> Result<String, String> {
    let uid = machine_uid::get().map_err(|e| format!("读取硬件标识失败: {e}"))?;
    let mut hasher = Sha256::new();
    hasher.update(uid.as_bytes());
    let digest = hasher.finalize();
    Ok(format_code(&digest))
}

fn compute_license(machine_id: &str) -> Result<String, String> {
    let mid = normalize_hex(machine_id);
    if mid.len() != 16 {
        return Err(format!("机器码长度错误: {}", mid.len()));
    }
    let mut mac =
        HmacSha256::new_from_slice(LICENSE_SECRET).map_err(|e| format!("HMAC 初始化失败: {e}"))?;
    mac.update(mid.as_bytes());
    let result = mac.finalize().into_bytes();
    Ok(format_code(&result))
}

/// 前端调用: await invoke('get_machine_id')
#[tauri::command]
pub fn get_machine_id() -> Result<String, String> {
    raw_machine_id()
}

/// 前端调用: await invoke('verify_license', { machineId, licenseKey })
#[tauri::command]
pub fn verify_license(machine_id: String, license_key: String) -> Result<bool, String> {
    let expected = compute_license(&machine_id)?;
    let input = normalize_hex(&license_key);
    let expected_raw = normalize_hex(&expected);
    Ok(input == expected_raw)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn license_format() {
        let code = compute_license("A3F28B1C9D4E7F06").unwrap();
        assert_eq!(code.len(), 19); // 16 hex + 3 dashes
        assert_eq!(code.matches('-').count(), 3);
    }
}
