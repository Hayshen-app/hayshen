import { ReactComponent as NewLogo } from '@/assets/icons/newLogo.svg';
import type { SVGProps } from 'react';

type HayShenLogoProps = SVGProps<SVGSVGElement>;

export const HayShenLogo = ({ width = 220, height = 50, color = 'currentColor', ...props }: HayShenLogoProps) => (
  <NewLogo width={width} height={height} color={color} role="img" aria-label="HayShen" {...props} />
);
