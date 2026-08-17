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

/*
 * ---------------------------------------------------------------------------------------
 * Variants.
 *
 * One payload per feature proves the feature renders. It does not prove the *option* set
 * renders, and the options are where the surprises are: eight notification positions that
 * have to stack independently, a dialog with no cancel button, a menu with more items than
 * fit. Each of these is a state a resource can legitimately ask for and none of them was
 * reachable without editing this file.
 * ---------------------------------------------------------------------------------------
 */

/**
 * A skill check slow enough to look at.
 *
 * The named difficulties give a window of well under a second, so the ring has come and
 * gone before you can judge whether it looked right — the only way to review the component
 * was to fail it repeatedly. A custom difficulty is part of the public API
 * (`GameDifficulty` accepts `{areaSize, speedMultiplier}`), so this is a supported payload
 * rather than a harness trick.
 */
export const debugSkillCheckSlow = () =>
  fire('startSkillCheck', {
    difficulty: [
      { areaSize: 80, speedMultiplier: 0.15 },
      { areaSize: 60, speedMultiplier: 0.2 },
    ],
    inputs: ['W', 'A'],
  });

/** Every position at once. Eight stacks that must not merge into one. */
export const debugNotificationPositions = () => {
  const positions = [
    'top-left',
    'top',
    'top-right',
    'center-left',
    'center-right',
    'bottom-left',
    'bottom',
    'bottom-right',
  ] as const;

  positions.forEach((position, index) =>
    fire('notify', {
      title: position,
      description: 'Position check',
      type: index % 2 ? 'inform' : 'warning',
      position,
      duration: 10000,
    }),
  );
};

/**
 * The two types the single payload above never sent, plus the two shapes that break layout.
 *
 * A notification with no description is a different box from one with a description, and a
 * description long enough to wrap is where a fixed height shows up as clipped text.
 */
export const debugNotificationShapes = () => {
  fire('notify', { title: 'Inform', description: 'Something happened', type: 'inform' });
  fire('notify', { title: 'Warning', description: 'Something is wrong', type: 'warning' });
  fire('notify', { title: 'Title only, no description', type: 'success' });
  fire('notify', {
    description: 'Description only, no title — the icon has nothing to align to.',
    type: 'error',
  });
  fire('notify', {
    title: 'Long',
    description:
      'A description long enough to wrap onto several lines, which is what a script that ' +
      'reports why something failed will actually send. Anything that clips instead of ' +
      'growing shows up here and nowhere else.',
    type: 'inform',
    duration: 12000,
  });
};

/** No cancel button, and small. `cancel: false` is the default and so the untested path. */
export const debugAlertBare = () =>
  fire('sendAlert', {
    header: 'Confirm only',
    content: 'One button. Escape must still close it.',
    size: 'xs',
  });

/** The four TextUI positions, one after another — they replace rather than stack. */
export const debugTextUIPositions = (() => {
  const positions = ['right-center', 'left-center', 'top-center', 'bottom-center'] as const;
  let next = 0;

  return () => {
    const position = positions[next];
    next = (next + 1) % positions.length;
    // No icon on two of them: the text has to centre itself rather than sit in a column
    // that is only there when an icon is.
    fire('textUi', {
      text: `Position: ${position}`,
      position,
      icon: next % 2 ? 'door-open' : undefined,
    });
  };
})();

export const debugTextUIHide = () => fire('textUiHide', {});

/**
 * A menu with far more items than fit.
 *
 * ox_lib's list menu scrolls and keeps the selection centred; with eleven items it never
 * has to, so the scroll path only runs in game.
 */
export const debugMenuLong = () =>
  fire('setMenu', {
    title: 'Long menu',
    items: Array.from({ length: 40 }, (_, index) => ({
      label: `Item ${index + 1}`,
      description: index % 4 === 0 ? 'Every fourth one has a description' : undefined,
      icon: index % 3 === 0 ? 'tag' : undefined,
    })),
  });

/**
 * A menu with no items.
 *
 * Reachable in play: a resource filters its own list and can filter it to nothing. Today
 * this draws an empty box the height of the header, which looks like a failure — worth
 * being able to see rather than worth hiding.
 */
export const debugMenuEmpty = () => fire('setMenu', { title: 'Nothing here', items: [] });

export const debugContextEmpty = () => fire('showContext', { title: 'Nothing here', options: [] });

/*
 * The close and cancel channels.
 *
 * Every one of these is Lua interrupting something the player is in the middle of — a
 * progress bar cancelled because the item was taken away, a menu closed because the shop
 * shut. They are a different code path from the player dismissing the same thing himself,
 * they run at a moment the UI did not choose, and none of them could be triggered from a
 * browser before now.
 */
export const debugCloseMenu = () => fire('closeMenu', {});
export const debugHideContext = () => fire('hideContext', {});
export const debugCloseAlert = () => fire('closeAlertDialog', {});
export const debugCloseInput = () => fire('closeInputDialog', {});
export const debugProgressCancel = () => fire('progressCancel', {});
export const debugSkillCheckCancel = () => fire('skillCheckCancel', {});
