import { debugData } from '../../lib/nui';

/**
 * Realistic payloads for driving every feature in a browser, ported from the React
 * build's features/dev/debug/*.ts. Kept as one module because they are only data.
 *
 * They fire immediately rather than after the 1000ms the React helpers defaulted to —
 * a panel button that does nothing for a second reads as broken.
 */

const fire = (action: string, data: unknown) => debugData([{ action, data }], 0);

export const debugInput = () =>
  fire('openDialog', {
    heading: 'Police locker',
    rows: [
      {
        type: 'input',
        label: 'Locker number',
        placeholder: '420',
        description: 'Description that tells you what this input field does',
      },
      { type: 'time', format: '12', label: 'Locker Time' },
      { type: 'checkbox', label: 'Some checkbox' },
      { type: 'input', label: 'Locker PIN', password: true, icon: 'lock' },
      { type: 'checkbox', label: 'Some other checkbox', checked: true },
      {
        type: 'select',
        label: 'Locker type',
        options: [
          { value: 'option1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ],
      },
      { type: 'number', label: 'Number counter', default: 12, min: 3, max: 10, icon: 'receipt' },
      { type: 'number', label: 'Price', default: 6.5, min: 0, max: 10, icon: 'receipt' },
      { type: 'slider', label: 'Slide bar', min: 10, max: 50, step: 2 },
      { type: 'date', label: 'Date', returnString: true, format: 'DD/MM/YYYY' },
      { type: 'color', label: 'Colour', default: '#22d3ee' },
      { type: 'textarea', label: 'Notes', autosize: true },
    ],
  });

export const debugAlert = () =>
  fire('sendAlert', {
    header: 'Hello there',
    content: 'General kenobi  \n Markdown works',
    centered: true,
    size: 'lg',
    overflow: true,
    cancel: true,
  });

export const debugContext = () =>
  fire('showContext', {
    title: 'Vehicle garage',
    options: [
      { title: 'Empty button' },
      {
        title: 'Karin Kuruma',
        arrow: true,
        colorScheme: '#4792f5',
        metadata: [
          { label: 'Body', value: '55%', progress: 55, colorScheme: '#ff5050' },
          { label: 'Engine', value: '100%', progress: 100, colorScheme: '#3ecf8e' },
          { label: 'Oil', progress: 11 },
          { label: 'Fuel', progress: 87 },
        ],
      },
      {
        title: 'Example button',
        description: 'Example button description',
        icon: 'inbox',
        metadata: [{ label: 'Value 1', value: 300 }],
        disabled: true,
      },
      {
        title: 'Oil Level',
        description: 'Vehicle oil level',
        progress: 30,
        icon: 'oil-can',
        metadata: [{ label: 'Remaining Oil', value: '30%' }],
        arrow: true,
      },
      {
        title: 'Durability',
        progress: 80,
        icon: 'car-side',
        metadata: [{ label: 'Durability', value: '80%' }],
        colorScheme: '#4792f5',
      },
      {
        title: 'Menu button',
        icon: 'bars',
        menu: 'other_example_menu',
        arrow: false,
        description: 'Takes you to another menu',
        metadata: ['It also has metadata support'],
      },
      {
        title: 'Event button',
        description: 'Open a menu and send event data',
        icon: 'check',
        arrow: true,
        event: 'some_event',
        args: { value1: 300, value2: 'Other value' },
      },
    ],
  });

export const debugMenu = () =>
  fire('setMenu', {
    title: 'Vehicle garage',
    items: [
      { label: 'Option 1', icon: 'heart' },
      {
        label: 'Option 2',
        icon: 'basket-shopping',
        description: 'Tooltip description 1',
        checked: true,
      },
      {
        label: 'Vehicle class',
        values: ['pogchamp', 'nice champ', { label: 'POGGERS', description: 'CHAMPPERS' }],
        icon: 'tag',
        description: 'Side scroll general description',
      },
      { label: 'Oil Level', progress: 30, icon: 'oil-can', description: 'Remaining Oil: 30%' },
      {
        label: 'Durability',
        progress: 80,
        icon: 'car-side',
        description: 'Durability: 80%',
        colorScheme: '#4792f5',
        iconColor: '#55778d',
      },
      { label: 'Option 1' },
      { label: 'Option 2' },
      { label: 'Vehicle class', values: ['Nice', 'Super nice', 'Extra nice'], defaultIndex: 1 },
      { label: 'Option 1' },
      { label: 'Option 2' },
      { label: 'Vehicle class', values: ['Nice', 'Super nice', 'Extra nice'] },
    ],
  });

export const debugRadial = () =>
  fire('openRadialMenu', {
    items: [
      { icon: 'palette', label: 'Paint' },
      { icon: 'warehouse', label: 'Garage' },
      { icon: 'palette', label: 'Quite Long Text' },
      { icon: 'palette', label: 'Fahrzeuginteraktionen' },
      { icon: 'car', label: 'Vehicle' },
      { icon: 'user', label: 'Personal' },
      { icon: 'key', label: 'Keys' },
      { icon: 'bell', label: 'Alerts' },
    ],
  });

export const debugNotification = () => {
  fire('notify', {
    title: 'Success',
    description: 'Notification description',
    type: 'success',
    id: 'pogchamp',
    duration: 20000,
  });
  // No `position` override. Upstream's payload put this one at 'bottom' to show off
  // positioning, which just looked like the stack was broken in two.
  fire('notify', {
    title: 'Error',
    description: 'Notification description',
    type: 'error',
  });
  fire('notify', {
    title: 'Custom icon success',
    description: 'Notification description',
    type: 'success',
    icon: 'microchip',
    showDuration: false,
  });
};

export const debugProgressbar = () => fire('progress', { label: 'Using Lockpick', duration: 8000 });

export const debugCircleProgressbar = () =>
  fire('circleProgress', { duration: 8000, label: 'Using Armour' });

export const debugTextUI = () =>
  fire('textUi', {
    text: '[E] - Access locker inventory  \n [G] - Do something else',
    position: 'right-center',
    icon: 'door-open',
  });

export const debugSkillCheck = () =>
  fire('startSkillCheck', { difficulty: ['easy', 'easy', 'hard'], inputs: ['W', 'A', 'S', 'D'] });
