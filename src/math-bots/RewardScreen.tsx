// The reward, for now: a plain screen that says how many Bolts he has.
//
// THE SEAM. The 3D robot fight goes here, in place of this file's body: build it from
// .scratch/math-bots/prototypes/p7-combined/ and mount it from this component, which App shows for the 'reward' screen.
// It should load only when this screen opens, so question screens never pay for it. `player.state.value.currency.balance`
// is the balance, and spending belongs in game.ts beside `practice`, as createRewardPurchases in the sibling games.
// The fight has no math in it, and the word rule holds: knocked out, stopped, sent spinning.
import { useEffect } from 'preact/hooks';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { MATH_CURRENCY } from './branding';
import { player } from './game';
import { screen } from './nav';
import { NUMBERS_TO } from './phrases';
import { startRound } from './round';
import { said } from './numbers/say';
import { BotArt } from './BotArt';
import { useVoice } from './voice';

export function RewardScreen() {
  const voice = useVoice(), balance = player.state.value.currency.balance;
  useEffect(() => {
    if (balance === 1) void voice.say('You have 1 Bolt.', 'Your robot is waiting in the workshop.');
    else if (balance <= NUMBERS_TO) void voice.say('You have', said(balance), 'Bolts.', 'Your robot is waiting in the workshop.');
    else void voice.say('Look at all your Bolts!', 'Your robot is waiting in the workshop.');
  }, []);
  return (
    <div class="screen reward-screen">
      <h1>Workshop</h1>
      <BotArt class="workshop-bot" />
      <div class="bigpile"><CurrencyIcon kind={MATH_CURRENCY} size={72} /><span>{balance}</span></div>
      <p>You have {balance} {balance === 1 ? 'Bolt' : 'Bolts'}.</p>
      <div class="reward-btns">
        <IconButton label="Home" onClick={() => { screen.value = 'home'; }}>🏠</IconButton>
        <IconButton label="Play" class="go" onClick={() => startRound()}>▶</IconButton>
      </div>
    </div>
  );
}
