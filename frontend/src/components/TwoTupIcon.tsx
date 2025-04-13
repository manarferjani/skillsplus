// TwoTupIcon.tsx
interface TwoTupIconProps {
    size?: number;
    color?: string;
  }
  
  export const TwoTupIcon = ({ size = 24, color = "#FF6B6B" }: TwoTupIconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
      <path d="M12 12l-8-5" />
      <path d="M12 12l8-5" />
    </svg>
  );