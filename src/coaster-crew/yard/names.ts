// How things are named aloud: a Guest Coaster by its number while the voice has one (to 100), then just "Guest Coaster".
import { NUMBERS_TO, type Phrase } from '../phrases';

export const guestSaid = (n: number): Phrase[] => (n <= NUMBERS_TO ? ['Guest Coaster', `${n}` as Phrase] : ['Guest Coaster']);
export const guestLabel = (n: number) => `Guest Coaster ${n}`;
