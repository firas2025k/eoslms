export function NextjsMark({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex size-14 items-center justify-center rounded-sm bg-neutral-900 text-white"
      }
      aria-hidden="true"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M13.2 6.5h2.1L21.5 21h-2.35l-1.35-3.55h-6.55L9.9 21H7.55L13.2 6.5Zm.55 8.85h4.55l-2.25-5.95-2.3 5.95Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export function DockerMark({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex size-14 items-center justify-center rounded-sm bg-[#2496ED] text-white"
      }
      aria-hidden="true"
    >
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <path
          d="M18.4 5.2h-2.2V7.4h2.2V5.2Zm-2.6 0H13.6V7.4h2.2V5.2Zm-2.6 0H11V7.4h2.2V5.2Zm5.2 2.6h-2.2V9.9h2.2V7.8Zm-2.6 0H13.6V9.9h2.2V7.8Zm-2.6 0H11V9.9h2.2V7.8Zm-2.6 0H8.4V9.9H10.6V7.8Zm10.4 2.6H8.2c-.2 1.9.3 4.4 2.2 5.9 1.2 1 2.9 1.5 5 1.5 3.6 0 6.3-1.5 7.6-4.1.7.1 1.8 0 2.5-.6.8-.7 1-1.6 1-1.6s-1.7.3-2.7-.4c-.4-.3-.7-.8-.8-1.2h-5.2Zm-12.8 0H5.8v2.1h2.2V10.4Zm-2.6 0H3.2v2.1h2.2V10.4Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export function TypescriptMark({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex size-14 items-center justify-center rounded-sm bg-[#3178C6] text-white"
      }
      aria-hidden="true"
    >
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
        <path
          d="M11.6 4.2h4.8v1.7h-1.55V16H13.1V5.9H11.6V4.2Zm6.35 5.35c.35-.7 1.05-1.2 2.1-1.2 1.55 0 2.45.85 2.45 2.35V16h-1.7v-4.95c0-.75-.35-1.15-1-1.15-.65 0-1.1.45-1.1 1.2V16h-1.7V9.55h.95v.55c.25-.4.7-.75 1.4-.75.2 0 .4.05.6.1Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
