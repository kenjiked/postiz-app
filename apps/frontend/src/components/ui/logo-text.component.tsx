import React from 'react';

export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-[8px]">
      <svg
        width="33"
        height="33"
        viewBox="0 0 33 33"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="33" height="33" rx="8" fill="#0EA5E9" />
        <path
          d="M8 10.5C8 9.67157 8.67157 9 9.5 9H14.5C15.3284 9 16 9.67157 16 10.5V22.5C16 23.3284 15.3284 24 14.5 24H9.5C8.67157 24 8 23.3284 8 22.5V10.5Z"
          fill="white"
        />
        <path
          d="M17 10.5C17 9.67157 17.6716 9 18.5 9H23.5C24.3284 9 25 9.67157 25 10.5V22.5C25 23.3284 24.3284 24 23.5 24H18.5C17.6716 24 17 23.3284 17 22.5V10.5Z"
          fill="white"
          fillOpacity="0.6"
        />
      </svg>
      <span
        className="text-[22px] font-semibold tracking-tight"
        style={{ color: 'currentColor' }}
      >
        SocialHub
      </span>
    </div>
  );
};
