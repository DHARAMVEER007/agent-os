use tauri::{PhysicalPosition, PhysicalRect, PhysicalSize, WebviewWindow};

const WIDGET_MARGIN_LOGICAL_PX: f64 = 16.0;

fn bottom_right_position(
    work_area: &PhysicalRect<i32, u32>,
    window_size: PhysicalSize<u32>,
    margin_physical_px: u32,
) -> PhysicalPosition<i32> {
    let x_offset = work_area
        .size
        .width
        .saturating_sub(window_size.width)
        .saturating_sub(margin_physical_px);
    let y_offset = work_area
        .size
        .height
        .saturating_sub(window_size.height)
        .saturating_sub(margin_physical_px);

    PhysicalPosition::new(
        work_area
            .position
            .x
            .saturating_add(i32::try_from(x_offset).unwrap_or(i32::MAX)),
        work_area
            .position
            .y
            .saturating_add(i32::try_from(y_offset).unwrap_or(i32::MAX)),
    )
}

pub fn position_bottom_right(window: &WebviewWindow) -> tauri::Result<()> {
    let Some(monitor) = window.primary_monitor()? else {
        return Ok(());
    };

    let margin_physical_px = (WIDGET_MARGIN_LOGICAL_PX * monitor.scale_factor()).round() as u32;
    let position = bottom_right_position(
        monitor.work_area(),
        window.outer_size()?,
        margin_physical_px,
    );

    window.set_position(position)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn positions_inside_the_bottom_right_work_area() {
        let work_area = PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(1920, 1040),
        };

        let position = bottom_right_position(&work_area, PhysicalSize::new(120, 120), 16);

        assert_eq!(position, PhysicalPosition::new(1784, 904));
    }

    #[test]
    fn supports_monitors_with_negative_desktop_coordinates() {
        let work_area = PhysicalRect {
            position: PhysicalPosition::new(-1440, 0),
            size: PhysicalSize::new(1440, 900),
        };

        let position = bottom_right_position(&work_area, PhysicalSize::new(120, 120), 16);

        assert_eq!(position, PhysicalPosition::new(-136, 764));
    }
}
