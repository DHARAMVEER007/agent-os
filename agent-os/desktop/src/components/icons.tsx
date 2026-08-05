import type { PropsWithChildren } from "react";

interface IconProps {
  className?: string;
}

// Inline SVGs keep the panel dependency-free and let every glyph inherit the
// colour of the tile it sits in.
function Icon({ children, className }: PropsWithChildren<IconProps>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 7.1 4.7a2 2 0 0 0 2.2 0L20.5 8" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
    </Icon>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3 7 21M17 3l-2 18M4 8.5h16M3 15.5h16" />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="m8.5 12 2.5 2.5L16 9.5" />
    </Icon>
  );
}

export function ChipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="3" />
      <path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 9a6 6 0 1 0-12 0c0 4.5-2 5.5-2 5.5h16S18 13.5 18 9Z" />
      <path d="M13.7 18.5a2 2 0 0 1-3.4 0" />
    </Icon>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.8 9a3 3 0 0 0 1.9 1.9l5.5 1.8-5.5 1.8A3 3 0 0 0 13.8 16L12 21.5 10.2 16a3 3 0 0 0-1.9-1.9L2.8 12.3l5.5-1.8A3 3 0 0 0 10.2 9Z" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 14.5 6-6 6 6" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 12h12" />
    </Icon>
  );
}
