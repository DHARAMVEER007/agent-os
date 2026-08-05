pub mod store;

use tauri::{LogicalSize, PhysicalPosition, PhysicalRect, PhysicalSize, WebviewWindow};

const WIDGET_MARGIN_LOGICAL_PX: f64 = 16.0;
const COLLAPSED_WIDGET_LOGICAL_PX: f64 = 104.0;
const EXPANDED_PANEL_LOGICAL_WIDTH: f64 = 400.0;
const EXPANDED_PANEL_LOGICAL_HEIGHT: f64 = 700.0;

/// Where the user last left the widget, so expanding and collapsing does not
/// send it back to its default corner.
#[derive(Default)]
pub struct WidgetLayout {
    collapsed_position: Option<PhysicalPosition<i32>>,
    expanded_position: Option<PhysicalPosition<i32>>,
    is_expanded: bool,
}

impl WidgetLayout {
    pub fn with_collapsed_position(position: Option<PhysicalPosition<i32>>) -> Self {
        Self {
            collapsed_position: position,
            ..Self::default()
        }
    }

    pub fn collapsed_position(&self) -> Option<PhysicalPosition<i32>> {
        self.collapsed_position
    }

    /// Records a window move. Moves made while the panel is open belong to the
    /// panel, and are folded back into the widget position when it collapses.
    pub fn remember_move(&mut self, position: PhysicalPosition<i32>) {
        if !self.is_expanded {
            self.collapsed_position = Some(position);
        }
    }
}

fn as_i32(value: u32) -> i32 {
    i32::try_from(value).unwrap_or(i32::MAX)
}

/// Shrinks a requested size so the window still fits the work area with margins.
fn fitted_size(
    work_area: &PhysicalRect<i32, u32>,
    requested: PhysicalSize<u32>,
    margin_physical_px: u32,
) -> PhysicalSize<u32> {
    let reserved = margin_physical_px.saturating_mul(2);

    PhysicalSize::new(
        requested
            .width
            .min(work_area.size.width.saturating_sub(reserved)),
        requested
            .height
            .min(work_area.size.height.saturating_sub(reserved)),
    )
}

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
        work_area.position.x.saturating_add(as_i32(x_offset)),
        work_area.position.y.saturating_add(as_i32(y_offset)),
    )
}

fn clamped_axis(
    desired: i32,
    area_origin: i32,
    area_length: u32,
    window_length: u32,
    margin_physical_px: u32,
) -> i32 {
    let lowest = area_origin.saturating_add(as_i32(margin_physical_px));
    let highest = area_origin.saturating_add(as_i32(
        area_length
            .saturating_sub(window_length)
            .saturating_sub(margin_physical_px),
    ));

    desired.clamp(lowest.min(highest), highest.max(lowest))
}

/// Keeps a window fully inside the visible work area.
fn clamped_position(
    work_area: &PhysicalRect<i32, u32>,
    desired: PhysicalPosition<i32>,
    window_size: PhysicalSize<u32>,
    margin_physical_px: u32,
) -> PhysicalPosition<i32> {
    PhysicalPosition::new(
        clamped_axis(
            desired.x,
            work_area.position.x,
            work_area.size.width,
            window_size.width,
            margin_physical_px,
        ),
        clamped_axis(
            desired.y,
            work_area.position.y,
            work_area.size.height,
            window_size.height,
            margin_physical_px,
        ),
    )
}

/// Holds the bottom-right corner still while the window changes size, so the
/// panel grows away from the corner the widget already occupies.
fn anchored_position(
    work_area: &PhysicalRect<i32, u32>,
    current_position: PhysicalPosition<i32>,
    current_size: PhysicalSize<u32>,
    new_size: PhysicalSize<u32>,
    margin_physical_px: u32,
) -> PhysicalPosition<i32> {
    let desired = PhysicalPosition::new(
        current_position
            .x
            .saturating_add(as_i32(current_size.width))
            .saturating_sub(as_i32(new_size.width)),
        current_position
            .y
            .saturating_add(as_i32(current_size.height))
            .saturating_sub(as_i32(new_size.height)),
    );

    clamped_position(work_area, desired, new_size, margin_physical_px)
}

/// Returns the widget to where it sat before expanding, carrying over any drag
/// the user applied to the panel in the meantime.
fn restored_position(
    work_area: &PhysicalRect<i32, u32>,
    collapsed_position: PhysicalPosition<i32>,
    expanded_position: PhysicalPosition<i32>,
    current_position: PhysicalPosition<i32>,
    new_size: PhysicalSize<u32>,
    margin_physical_px: u32,
) -> PhysicalPosition<i32> {
    let desired = PhysicalPosition::new(
        collapsed_position
            .x
            .saturating_add(current_position.x.saturating_sub(expanded_position.x)),
        collapsed_position
            .y
            .saturating_add(current_position.y.saturating_sub(expanded_position.y)),
    );

    clamped_position(work_area, desired, new_size, margin_physical_px)
}

fn margin_physical_px(scale_factor: f64) -> u32 {
    (WIDGET_MARGIN_LOGICAL_PX * scale_factor).round() as u32
}

/// Prefers the monitor the window currently sits on so a widget dragged to a
/// second display is measured against that display's work area.
fn active_monitor(window: &WebviewWindow) -> tauri::Result<Option<tauri::Monitor>> {
    match window.current_monitor()? {
        Some(monitor) => Ok(Some(monitor)),
        None => window.primary_monitor(),
    }
}

/// Places the widget at startup: where the user last left it, or in the default
/// corner on a first run.
pub fn position_at_startup(
    window: &WebviewWindow,
    saved: Option<PhysicalPosition<i32>>,
) -> tauri::Result<()> {
    let Some(monitor) = window.primary_monitor()? else {
        return Ok(());
    };

    let margin = margin_physical_px(monitor.scale_factor());
    let work_area = monitor.work_area();
    let size = window.outer_size()?;

    let position = match saved {
        Some(saved) => clamped_position(work_area, saved, size, margin),
        None => bottom_right_position(work_area, size, margin),
    };

    window.set_position(position)
}

/// Everything needed to decide where a resized widget belongs.
struct Placement {
    work_area: PhysicalRect<i32, u32>,
    margin_physical_px: u32,
    size: PhysicalSize<u32>,
    current_position: PhysicalPosition<i32>,
    current_size: PhysicalSize<u32>,
}

/// Measures the window before it is resized.
///
/// The eventual position must be derived from `size` rather than from the
/// window's reported size, because a size change is not observable through
/// `outer_size` until the platform has applied it.
fn measure(
    window: &WebviewWindow,
    requested: LogicalSize<f64>,
) -> tauri::Result<Option<Placement>> {
    let Some(monitor) = active_monitor(window)? else {
        return Ok(None);
    };

    let scale_factor = monitor.scale_factor();
    let margin_physical_px = margin_physical_px(scale_factor);
    let work_area = *monitor.work_area();

    Ok(Some(Placement {
        size: fitted_size(
            &work_area,
            requested.to_physical::<u32>(scale_factor),
            margin_physical_px,
        ),
        work_area,
        margin_physical_px,
        current_position: window.outer_position()?,
        current_size: window.outer_size()?,
    }))
}

fn apply(
    window: &WebviewWindow,
    size: PhysicalSize<u32>,
    position: PhysicalPosition<i32>,
) -> tauri::Result<()> {
    window.set_size(size)?;
    window.set_position(position)
}

pub fn expand(window: &WebviewWindow, layout: &mut WidgetLayout) -> tauri::Result<()> {
    let requested = LogicalSize::new(EXPANDED_PANEL_LOGICAL_WIDTH, EXPANDED_PANEL_LOGICAL_HEIGHT);

    let Some(placement) = measure(window, requested)? else {
        return window.set_size(requested);
    };

    let position = anchored_position(
        &placement.work_area,
        placement.current_position,
        placement.current_size,
        placement.size,
        placement.margin_physical_px,
    );

    layout.collapsed_position = Some(placement.current_position);
    layout.expanded_position = Some(position);
    layout.is_expanded = true;

    apply(window, placement.size, position)
}

pub fn collapse(window: &WebviewWindow, layout: &mut WidgetLayout) -> tauri::Result<()> {
    let requested = LogicalSize::new(COLLAPSED_WIDGET_LOGICAL_PX, COLLAPSED_WIDGET_LOGICAL_PX);

    let Some(placement) = measure(window, requested)? else {
        return window.set_size(requested);
    };

    let position = match layout.collapsed_position.zip(layout.expanded_position) {
        Some((collapsed_position, expanded_position)) => restored_position(
            &placement.work_area,
            collapsed_position,
            expanded_position,
            placement.current_position,
            placement.size,
            placement.margin_physical_px,
        ),
        None => anchored_position(
            &placement.work_area,
            placement.current_position,
            placement.current_size,
            placement.size,
            placement.margin_physical_px,
        ),
    };

    layout.collapsed_position = Some(position);
    layout.is_expanded = false;

    apply(window, placement.size, position)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn laptop_work_area() -> PhysicalRect<i32, u32> {
        PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(1920, 1040),
        }
    }

    #[test]
    fn positions_inside_the_bottom_right_work_area() {
        let position = bottom_right_position(&laptop_work_area(), PhysicalSize::new(120, 120), 16);

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

    #[test]
    fn keeps_a_requested_size_that_fits_the_work_area() {
        let work_area = laptop_work_area();

        assert_eq!(
            fitted_size(&work_area, PhysicalSize::new(1, 1), 16),
            PhysicalSize::new(1, 1)
        );
        assert_eq!(
            fitted_size(&work_area, PhysicalSize::new(400, 700), 16),
            PhysicalSize::new(400, 700)
        );
        assert_eq!(
            fitted_size(&work_area, PhysicalSize::new(1888, 1008), 16),
            PhysicalSize::new(1888, 1008)
        );
    }

    #[test]
    fn clamps_a_requested_size_that_exceeds_the_work_area() {
        let work_area = PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(1280, 600),
        };

        assert_eq!(
            fitted_size(&work_area, PhysicalSize::new(400, 700), 16),
            PhysicalSize::new(400, 568)
        );
    }

    #[test]
    fn clamps_to_zero_when_the_work_area_is_smaller_than_its_margins() {
        let work_area = PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(20, 20),
        };

        assert_eq!(
            fitted_size(&work_area, PhysicalSize::new(400, 700), 16),
            PhysicalSize::new(0, 0)
        );
    }

    #[test]
    fn expands_away_from_the_corner_the_widget_occupies() {
        let position = anchored_position(
            &laptop_work_area(),
            PhysicalPosition::new(900, 800),
            PhysicalSize::new(104, 104),
            PhysicalSize::new(400, 700),
            16,
        );

        assert_eq!(position, PhysicalPosition::new(604, 204));
    }

    #[test]
    fn keeps_an_expanded_panel_inside_the_work_area() {
        let position = anchored_position(
            &laptop_work_area(),
            PhysicalPosition::new(20, 40),
            PhysicalSize::new(104, 104),
            PhysicalSize::new(400, 700),
            16,
        );

        assert_eq!(position, PhysicalPosition::new(16, 16));
    }

    #[test]
    fn restores_the_widget_to_where_the_user_left_it() {
        let position = restored_position(
            &laptop_work_area(),
            PhysicalPosition::new(20, 40),
            PhysicalPosition::new(16, 16),
            PhysicalPosition::new(16, 16),
            PhysicalSize::new(104, 104),
            16,
        );

        assert_eq!(position, PhysicalPosition::new(20, 40));
    }

    #[test]
    fn carries_over_a_drag_applied_while_expanded() {
        let position = restored_position(
            &laptop_work_area(),
            PhysicalPosition::new(900, 800),
            PhysicalPosition::new(604, 204),
            PhysicalPosition::new(704, 254),
            PhysicalSize::new(104, 104),
            16,
        );

        assert_eq!(position, PhysicalPosition::new(1000, 850));
    }

    #[test]
    fn remembers_a_move_made_while_collapsed() {
        let mut layout = WidgetLayout::default();

        layout.remember_move(PhysicalPosition::new(300, 200));

        assert_eq!(
            layout.collapsed_position(),
            Some(PhysicalPosition::new(300, 200))
        );
    }

    #[test]
    fn ignores_a_move_made_while_expanded() {
        let mut layout = WidgetLayout::with_collapsed_position(Some(PhysicalPosition::new(20, 40)));
        layout.is_expanded = true;

        layout.remember_move(PhysicalPosition::new(900, 900));

        assert_eq!(
            layout.collapsed_position(),
            Some(PhysicalPosition::new(20, 40))
        );
    }

    #[test]
    fn starts_without_a_position_when_nothing_was_saved() {
        assert_eq!(
            WidgetLayout::with_collapsed_position(None).collapsed_position(),
            None
        );
    }

    #[test]
    fn clamps_a_restored_position_that_left_the_work_area() {
        let position = restored_position(
            &laptop_work_area(),
            PhysicalPosition::new(1800, 1000),
            PhysicalPosition::new(0, 0),
            PhysicalPosition::new(400, 400),
            PhysicalSize::new(104, 104),
            16,
        );

        assert_eq!(position, PhysicalPosition::new(1800, 920));
    }
}
