import '../../src/app/selectedVoice';
import { celebrateUnlock } from '../../src/celebrate/garageShow';
import { createGaragePurchases } from '../../src/app/purchases';
import { moneySave } from '../../src/app/save';
import { defaultFit } from '../../src/garage/catalog';
import { proposePurchase } from '../../src/garage/purchases';
import { GarageStage } from '../../src/garage/three/stage';
import { freshSave } from '../../src/save/migrate';
import { createStore } from '../../src/save/store';
import { createVoiceScope } from '../../src/voice/say';

const root = document.getElementById('fixture')!;
root.innerHTML = '<div style="width:640px;height:480px"><canvas></canvas></div><output id="silhouette"></output><output id="saved-state"></output>';
const element = root.querySelector('div')!, stage = new GarageStage(root.querySelector('canvas')!, element);
const store = createStore({
  key: 'purchase-presentation-fixture', adapter: moneySave,
  backing: { read: () => JSON.stringify({ ...freshSave(), body: 'pickup', bolts: 50 }), write() {} },
});
const buy = createGaragePurchases(store, { proposePurchase }), voice = createVoiceScope();

function button(label: string, action: () => void) {
  const button = document.createElement('button');
  button.textContent = label;
  button.onclick = action;
  root.appendChild(button);
}

void store.load().then(() => {
  stage.setTruck('pickup', store.state.peek().garage.fitted.pickup!);
  store.state.subscribe(state => { document.getElementById('saved-state')!.textContent = JSON.stringify(moneySave.encode(state)); });
  button('Buy Giant', () => {
    const result = buy('tires:2');
    if (result.kind !== 'accepted') return;
    const fit = result.state.garage.fitted.pickup!;
    celebrateUnlock(stage, element, 'tires', 2, fit, 'You got Giant!', voice);
    stage.setTruck('pickup', fit);
  });
  button('Cancel show', voice.cancel);
  button('Resting Truck', () => {
    stage.setTruck('bigfoot', defaultFit());
    stage.setTruck('pickup', store.state.peek().garage.fitted.pickup!);
  });
  button('Sample Truck', () => {
    const r = element.getBoundingClientRect();
    const mask = Array.from({ length: 17 }, (_, y) => Array.from({ length: 33 }, (_, x) =>
      stage.hitsTruck(r.left + r.width * (0.25 + x / 64), r.top + r.height * (0.3 + y / 64)) ? '1' : '0').join('')).join('\n');
    document.getElementById('silhouette')!.textContent = mask;
  });
});
