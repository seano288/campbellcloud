import type { TruckLook } from '../arena/arena';
import { truckPic } from './truck';

/** His truck as a picture (cached per look). */
export function TruckPic({ look, size = 180, pitch = 0, class: c = '' }: { look: TruckLook; size?: number; pitch?: number; class?: string }) {
  return <img class={`truck-pic ${c}`} src={truckPic(look, size, pitch)} alt="" aria-hidden="true" />;
}
