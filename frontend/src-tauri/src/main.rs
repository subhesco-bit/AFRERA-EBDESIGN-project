#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// AFRERA desktop shell entrypoint.
//
// This wraps the existing frontend/ React SPA (see ../../README-DESKTOP.md
// and ../../MOBILE_DESKTOP_APPLICATION_STRATEGY.md for the reasoning). All
// business logic stays server-side in the existing Express/Node backend;
// this binary only provides the native window shell, system tray, and the
// OS-level capabilities enabled in tauri.conf.json's allowlist.
//
// A system tray is registered here because tauri.conf.json's `systemTray`
// block only supplies the icon/config — Tauri v1 still requires the tray
// (and its menu) to be built and attached to the `Builder` in code for it
// to actually appear.

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

fn build_tray_menu() -> SystemTrayMenu {
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit)
}

fn handle_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        // Left-click the tray icon: bring the main window to front.
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

fn main() {
    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(build_tray_menu()))
        .on_system_tray_event(handle_tray_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
