'use client';

export const Logo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      className="mt-[8px] min-w-[60px] min-h-[60px]"
    >
      <rect width="60" height="60" rx="14" fill="#0EA5E9" />
      <rect x="12" y="15" width="16" height="30" rx="4" fill="white" />
      <rect
        x="32"
        y="15"
        width="16"
        height="30"
        rx="4"
        fill="white"
        fillOpacity="0.6"
      />
    </svg>
  );
};
