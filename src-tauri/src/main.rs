// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use keyring::Entry;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct CredentialRequest {
    service: String,
    key: String,
}

#[derive(Serialize, Deserialize)]
struct CredentialResponse {
    success: bool,
    value: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn store_credential(service: String, key: String, value: String) -> CredentialResponse {
    let entry = match Entry::new(&service, &key) {
        Ok(entry) => entry,
        Err(e) => {
            return CredentialResponse {
                success: false,
                value: None,
                error: Some(format!("Failed to create credential entry: {}", e)),
            }
        }
    };

    match entry.set_password(&value) {
        Ok(_) => CredentialResponse {
            success: true,
            value: None,
            error: None,
        },
        Err(e) => CredentialResponse {
            success: false,
            value: None,
            error: Some(format!("Failed to store credential: {}", e)),
        },
    }
}

#[tauri::command]
fn get_credential(service: String, key: String) -> CredentialResponse {
    let entry = match Entry::new(&service, &key) {
        Ok(entry) => entry,
        Err(e) => {
            return CredentialResponse {
                success: false,
                value: None,
                error: Some(format!("Failed to create credential entry: {}", e)),
            }
        }
    };

    match entry.get_password() {
        Ok(password) => CredentialResponse {
            success: true,
            value: Some(password),
            error: None,
        },
        Err(e) => {
            if e == keyring::Error::NoEntry {
                CredentialResponse {
                    success: true,
                    value: None,
                    error: None,
                }
            } else {
                CredentialResponse {
                    success: false,
                    value: None,
                    error: Some(format!("Failed to retrieve credential: {}", e)),
                }
            }
        }
    }
}

#[tauri::command]
fn delete_credential(service: String, key: String) -> CredentialResponse {
    let entry = match Entry::new(&service, &key) {
        Ok(entry) => entry,
        Err(e) => {
            return CredentialResponse {
                success: false,
                value: None,
                error: Some(format!("Failed to create credential entry: {}", e)),
            }
        }
    };

    match entry.delete_credential() {
        Ok(_) => CredentialResponse {
            success: true,
            value: None,
            error: None,
        },
        Err(e) => {
            if e == keyring::Error::NoEntry {
                CredentialResponse {
                    success: true,
                    value: None,
                    error: None,
                }
            } else {
                CredentialResponse {
                    success: false,
                    value: None,
                    error: Some(format!("Failed to delete credential: {}", e)),
                }
            }
        }
    }
}

#[tauri::command]
fn has_credential(service: String, key: String) -> CredentialResponse {
    let entry = match Entry::new(&service, &key) {
        Ok(entry) => entry,
        Err(e) => {
            return CredentialResponse {
                success: false,
                value: None,
                error: Some(format!("Failed to create credential entry: {}", e)),
            }
        }
    };

    match entry.get_password() {
        Ok(_) => CredentialResponse {
            success: true,
            value: Some("true".to_string()),
            error: None,
        },
        Err(e) => {
            if e == keyring::Error::NoEntry {
                CredentialResponse {
                    success: true,
                    value: Some("false".to_string()),
                    error: None,
                }
            } else {
                CredentialResponse {
                    success: false,
                    value: None,
                    error: Some(format!("Failed to check credential: {}", e)),
                }
            }
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            store_credential,
            get_credential,
            delete_credential,
            has_credential
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
