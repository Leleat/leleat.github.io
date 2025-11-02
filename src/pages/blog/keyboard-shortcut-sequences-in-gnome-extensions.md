---
layout: "@/layouts/BlogPostLayout.astro"
title: "Keyboard shortcut sequences in GNOME extensions"
author: "Anh Tuan Le"
pubDate: "2024-08-26 01:00:00 +0200"
editDate: "2025-03-01 01:00:00 +0200"
tags: ["gnome extension", "concept"]
---

I've been prototyping what I call _keyboard shortcut sequences_ in a GNOME extension. I grew fond of them while using certain apps and wanted to document my results here.

## Motivation

In modern operating systems and most apps, keyboard shortcuts only consist of a single combination of possibly multiple modifier keys and **one** non-modifier key. Modifiers are keys like `Ctrl` or `Shift` and non-modifier keys are, well, the remaining keys. An example of this type of keyboard shortcut is `Ctrl C`.

Keyboard shortcuts are easier to remember if the keys can serve as a mnemonic or if there is some kind of system to them. For instance, `Ctrl C` to `c`opy, `Ctrl S` to `s`ave, `Ctrl F` to `f`ind, `Ctrl P` to `p`rint, and so on. But there are only so many permutations of different modifier keys and a single non-modifier key. Eventually, you'll end up with shortcuts that appear arbitrary and unsystematic, making them harder to remember.

This is where keyboard shortcut sequences come in. Shortcuts aren't triggered by a single key combination, but by a sequence of key combinations. This way, you can create a (hierarchical) system for shortcuts. Let's take `Ctrl Del` ➝ `w` as an example for a shortcut sequence. This shortcut would be triggered like this

1. Hold `Ctrl` and then press `Backspace`
2. Release `Ctrl` and `Backspace`
3. Press `w`

An action for this shortcut could be to delete the next word in an text editor; `Ctrl Del` ➝ `l` could delete the next line; and `Ctrl Del` ➝ `p` could delete an entire paragraph. This looks easy to remember, right? You basically only need to remember 1 key combination (`Ctrl Backspace`). It's certainly easier than remembering 3 random looking shortcuts.

The idea is not mine. There are apps that implement shortcut sequences like emacs and its [key sequences](https://www.emacswiki.org/emacs/KeySequence), VSCode's [chords](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules) (which is a bit of misnomer), [zed](https://zed.dev/docs/key-bindings#keybinding-syntax), vim, and logseq to name a few. The advantage is that every shortcut can be semantically meaningful because the amount of possible combinations is infinite. Of course, an absurdly long sequence is problematic as well. The fundamental idea is to create keyboard shortcuts that are easy to remember.

## Prototyping shortcut sequences in a GNOME extension

GNOME does not natively support shortcut sequences. A shortcut consists of modifier keys and **one** non-modifier key. Although shortcuts are saved as a string array, the items in the array only serve as alternative triggers for the same action. For example, in GNOME 47 `Super Alt Right` and `Super PageDown` both switch to the workspace to the right. I am not a linux desktop developer. So I don't know what would need to happen or which parties would need to be involved to develop this feature properly. Since I am developing GNOME extensions, I wanted to explore the possibility of including shortcut sequences, even if it's a hacky implementation. At least it could be a feature that is here now. So I've created a prototype which does just that. And it works... mostly. I'll go through some limitations later. But for now, let's look at the implementation. Let's start with a high-level overview of the implementation.

Since shortcuts can only consist of 1 key combination in GNOME, it makes sense to split shortcut sequences into 2 parts. The first part - let's call it _prefix_ - will be registered as a normal shortcut with GNOME. When a prefix is activated, the GNOME extension creates a widget that grabs the keyboard input, listens to the subsequent keys, and filters for matching shortcut sequences.

Let's go into more detail. In the settings schema XML file, I define keyboard shortcuts as usual but also add additional hidden keys for the prefixes.

```xml
<!-- The following entries are shortcut sequences. This shortcut will be     -->
<!-- registered with GNOME shortcut systemThe first item in the array is the -->
<!-- prefix. The subsequent items are the key symbols and modifiers          -->
<!-- separated by `+` for  each key combinination in a shortcut sequence.    -->
<!-- The reasoning behind it follows below the code snippet.                -->

<key name="focus-left" type="as">
    <default>['&lt;Super&gt;f','97+0']</default>
</key>
<key name="focus-right" type="as">
    <default>['&lt;Super&gt;f','98+0']</default>
</key>

<!-- This is a non-sequenced aka 'normal' shortcut because it's an array of  -->
<!-- length 1. This shortcut will be registered with GNOME's shortcut system -->

<key name="focus-right" type="as">
    <default>['&lt;Super&gt;g']</default>
</key>

<!-- additional keys for the prefixes of shortcut sequences -->

<key name="multi-stage-shortcut-activator-0" type="as">
    <default>['&lt;Super&gt;f']</default>
</key>
<key name="multi-stage-shortcut-activator-1" type="as">
    <default>[]</default>
</key>
<key name="multi-stage-shortcut-activator-2" type="as">
    <default>[]</default>
</key>
```

Then I have a `shortcuts.js` file that actually implements the logic on GNOME Shell's side. The entry for the logic is `Shortcuts::register`. You'll notice that shortcut sequences aren't registered with GNOME's native keybinding system because, as mentioned, GNOME doesn't support the concept of shortcut sequences. So instead of registering the shortcut sequences, I only register the prefixes and create a custom handler, the `MultiStageShortcutManager`, for the prefixes. Note that I used the term _activator_ instead of _prefix_ in the code. Another thing worth explaining is, starting with the second item, shortcut sequences save the key combinations as key symbols + a modifier state to compare them against the event in `MultiStageShortcutManager::vfunc_key_press_event` since I couldn't find a way to transform the Clutter event into the equivalent _accelerator label_.

```javascript
// shortcuts.js

import {
    Clutter,
    GLib,
    GObject,
    Main,
    Meta,
    Shell,
    St,
} from "./dependencies.js";

import { updateMultiStageShortcutActivators } from "../shared.js";
import { Settings } from "./settings.js";
import { Timeouts } from "./timeouts.js";

/** @type {Shortcuts} */
let SINGLETON = null;

function enable() {
    SINGLETON = new Shortcuts();
}

function disable() {
    SINGLETON.destroy();
    SINGLETON = null;
}

const INVALID_KEY_SEQUENCE_STATUS_LABEL = "Invalid shortcut...";
const NO_INPUT_STATUS_LABEL = "No input given...";
const WAITING_FOR_NEXT_KEY_STATUS_LABEL = "Waiting for next keys...";
const UNKNOWN_ERROR_STATUS_LABEL = "Unknown error...";

class Shortcuts {
    /** @type {string[]} */
    _registeredShortcuts = [];

    /** @type {MultiStageShortcutManager} */
    _multiStageShortcutManager = new MultiStageShortcutManager();

    constructor() {
        // This keeps the prefixes in sync with the shortcut sequences at least
        // on `enable` in case the user changed the shortcuts from the outside
        updateMultiStageShortcutActivators(Settings.getGioObject());
    }

    destroy() {
        Settings.unwatch(this);

        this._registeredShortcuts.forEach((shortcut) =>
            Main.wm.removeKeybinding(shortcut),
        );
        this._registeredShortcuts = [];

        this._multiStageShortcutManager.destroy();
        this._multiStageShortcutManager = null;
    }

    /**
     * @param {object} param
     * @param {ShortcutKey} param.key
     * @param {Function} [param.handler] - optional only for sequence prefixes
     * @param {Meta.KeyBindingFlags} [param.flags]
     * @param {Shell.ActionMode} [param.modes]
     */
    register({
        key,
        handler = () => {},
        flags = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
        modes = Shell.ActionMode.NORMAL,
    }) {
        if (this._registeredShortcuts.includes(key)) {
            throw new Error(`Shortcut "${key}" is already registered.`);
        }

        this._watchShortcutTypeChange(key, handler, flags, modes);

        if (this._isMultiStageShortcut(key)) {
            this._multiStageShortcutManager.register(key, handler);

            return;
        }

        let shortcutAddedSuccessfully = false;

        if (this._isMultiStageShortcutPrimaryActivator(key)) {
            shortcutAddedSuccessfully = Main.wm.addKeybinding(
                key,
                Settings.getGioObject(),
                flags,
                modes,
                () => this._multiStageShortcutManager.start(key),
            );
        } else {
            shortcutAddedSuccessfully = Main.wm.addKeybinding(
                key,
                Settings.getGioObject(),
                flags,
                modes,
                handler,
            );
        }

        if (shortcutAddedSuccessfully) {
            this._registeredShortcuts.push(key);
        }
    }

    _isMultiStageShortcut(key) {
        return (
            Settings.getGioObject().get_strv(key).length > 1 &&
            !this._isMultiStageShortcutPrimaryActivator(key)
        );
    }

    _isMultiStageShortcutPrimaryActivator(key) {
        return key.match(/^multi-stage-shortcut-activator-\d+$/);
    }

    /**
     * @param {string} key
     * @param {Function} handler
     * @param {Meta.KeyBindingFlags} flags
     * @param {Shell.ActionMode} modes
     */
    _watchShortcutTypeChange(key, handler, flags, modes) {
        if (this._isMultiStageShortcutPrimaryActivator(key)) {
            return;
        }

        const id = Settings.watch(
            key,
            () => {
                // Multi-Stage -> Multi-Stage and Single -> Single shortcut
                // changes don't need to be handled. The reason for Multi-Stage
                // -> Multi-Stage is that we dynamically fetch the secondary
                // activators from the settings while the primary activator
                // (multi-stage-shortcut-activator-X) is registered just like a
                // Single shortcut and thus managed by the native keybinding
                // system. The later part applies to the Single -> Single
                // shortcut changes as well.

                const multiStageToSingle =
                    this._multiStageShortcutManager.isRegistered(key) &&
                    !this._isMultiStageShortcut(key);
                const singleToMultiStage =
                    !this._multiStageShortcutManager.isRegistered(key) &&
                    this._isMultiStageShortcut(key);

                if (multiStageToSingle) {
                    Settings.unwatch(id);

                    this._multiStageShortcutManager.unregister(key);

                    this.register({ key, handler, flags, modes });
                } else if (singleToMultiStage) {
                    Settings.unwatch(id);

                    Main.wm.removeKeybinding(key);
                    this._registeredShortcuts =
                        this._registeredShortcuts.filter(
                            (shortcut) => shortcut !== key,
                        );

                    this.register({ key, handler, flags, modes });
                }
            },
            { tracker: this },
        );
    }
}

class MultiStageShortcutManager extends Clutter.Actor {
    static {
        GObject.registerClass(this);
    }

    /** @type {Clutter.GrabState|null} */
    _grab = null;

    /** @type {Map<string, Function}>} */
    _handlers = new Map();

    /** @type {{primaryActivator: string, secondaryActivators: string[], handler: Function}[]} */
    _matchingMultiStageShortcuts = [];

    _statusLabel = new St.Label({
        opacity: 127,
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
    });

    constructor() {
        super({ reactive: true, visible: false });

        Main.panel._leftBox.add_child(this._statusLabel);
        global.stage.add_child(this);
    }

    destroy() {
        this._finish();

        this._handlers = null;
        this._matchingMultiStageShortcuts = null;

        this._statusLabel.destroy();
        this._statusLabel = null;

        super.destroy();
    }

    start(shortcutKey) {
        this.show();

        this._grab = Main.pushModal(this);

        if ((this._grab.get_seat_state() & Clutter.GrabState.KEYBOARD) === 0) {
            this._finish(UNKNOWN_ERROR_STATUS_LABEL);

            return;
        }

        if (this._statusLabelHideTimer) {
            Timeouts.remove(this._statusLabelHideTimer);
            this._statusLabelHideTimer = 0;
        }

        this._statusLabel.show();
        this._statusLabel.text = WAITING_FOR_NEXT_KEY_STATUS_LABEL;

        this._matchingMultiStageShortcuts = [];

        const [activator] = Settings.getGioObject().get_strv(shortcutKey);

        this._handlers.forEach((handler, scKey) => {
            const [shortcutActivator, ...secondaryActivators] =
                Settings.getGioObject().get_strv(scKey);

            if (shortcutActivator === activator) {
                this._matchingMultiStageShortcuts.push({
                    handler,
                    primaryActivator: shortcutActivator,
                    secondaryActivators,
                });
            }
        });

        this._startWaitingForInputTimer();
    }

    register(shortcut, handler) {
        return this._handlers.set(shortcut, handler);
    }

    unregister(shortcut) {
        return this._handlers.delete(shortcut);
    }

    isRegistered(shortcut) {
        return this._handlers.has(shortcut);
    }

    vfunc_key_press_event(event) {
        this._startWaitingForInputTimer();

        const eventKeyval = event.get_key_symbol();

        if (this._ignoreKeyval(eventKeyval)) {
            return Clutter.EVENT_STOP;
        }

        for (
            let i = this._matchingMultiStageShortcuts.length - 1;
            i >= 0;
            i--
        ) {
            const matchingMultiStageShortcut =
                this._matchingMultiStageShortcuts[i];
            const { secondaryActivators } = matchingMultiStageShortcut;
            const nextActivator = secondaryActivators.shift();
            const [nextKeyval, nextModifiers] = nextActivator.split("+");
            const isMatchingActivator =
                nextKeyval === String(eventKeyval) &&
                // Wayland includes NumLock/fn as part of the state.
                (nextModifiers ?? "0") ===
                    String(event.get_state() & ~Clutter.ModifierType.MOD2_MASK);

            if (isMatchingActivator) {
                if (secondaryActivators.length === 0) {
                    this._finish();
                    matchingMultiStageShortcut.handler();

                    return Clutter.EVENT_STOP;
                }
            } else {
                this._matchingMultiStageShortcuts.splice(i, 1);
            }
        }

        if (this._matchingMultiStageShortcuts.length === 0) {
            this._finish(INVALID_KEY_SEQUENCE_STATUS_LABEL);
        }

        return Clutter.EVENT_STOP;
    }

    _finish(error = "") {
        if (this._grab) {
            Main.popModal(this._grab);
            this._grab = null;
        }

        this._matchingMultiStageShortcuts = [];

        if (this._waitingForInputTimer) {
            Timeouts.remove(this._waitingForInputTimer);
            this._waitingForInputTimer = 0;
        }

        if (error) {
            this._statusLabel.show();
            this._statusLabel.text = error;
            this._statusLabelHideTimer = Timeouts.add({
                interval: 1500,
                fn: () => {
                    this._statusLabelHideTimer = 0;
                    this._statusLabel.hide();

                    return GLib.SOURCE_REMOVE;
                },
            });
        } else {
            this._statusLabel.hide();
        }

        this.hide();
    }

    _ignoreKeyval(keyval) {
        return [
            Clutter.KEY_Alt_L,
            Clutter.KEY_Alt_R,
            Clutter.KEY_Control_L,
            Clutter.KEY_Control_R,
            Clutter.KEY_Meta_L,
            Clutter.KEY_Meta_R,
            Clutter.KEY_Shift_L,
            Clutter.KEY_Shift_Lock,
            Clutter.KEY_Shift_R,
            Clutter.KEY_Super_L,
            Clutter.KEY_Super_R,
        ].includes(keyval);
    }

    _startWaitingForInputTimer() {
        this._waitingForInputTimer = Timeouts.add({
            name: "shell/shortcuts.js/MultiStageShortcutManager/_startWaitingForInputTimer",
            interval: 3000,
            fn: () => {
                this._waitingForInputTimer = 0;
                this._finish(NO_INPUT_STATUS_LABEL);

                return GLib.SOURCE_REMOVE;
            },
        });
    }
}

export { disable, enable, SINGLETON as Shortcuts };
```

There is also some code on the `prefs.js` side that handles the UI, sets the gsettings if the user changed the shortcuts, and keeps the gsettings for the prefixes in sync with the gsettings for the shortcut sequences. However, that is a bit too much to share here and fairly straightforward.

And that's it. It wasn't really hard to implement. That said, the current implementation has some issues, which I am not sure are fixable. But they aren't _that big_ of a deal.

## Limitations

The main issues are

1. `Super <NON_MODIFIER_KEY>` as a non-prefix key combination doesn't register on the initial press. For example, if the shortcut sequence is `Super a` ➝ `Super a`, and you press `Super a`, let go of `a` **and** the `Super` key, and press `Super a` again, it won't work. You need to keep holding `Super` after activating the prefix or press `Super a` twice after activating the prefix. I believe this is related to `Super` being used for the overview and not reaching `MutliStageShortcutManager::vfunc_key_press_event` on the first press. If I set the overview key to the right `Super` key, it works fine with the left `Super` key.
2. Some popups might close when the widget initiates the grab.

Less important issues are

1. When opening the shortcut editor in the preference window, I clear all prefix shortcuts so that the shortcut editor can capture the keyboard events, otherwise a keyboard shortcut sequence will be triggered if a prefix is activated. When the shortcut editor closes I re-set the prefixes. This is, at least in theory, problematic if the preference window crashes or is killed, as the prefixes won't be re-enabled. But that should be a rare case and the prefixes will be re-enabled the next time the preference window is opened or the extension is re-enabled.
2. And lastly, since a keyboard shortcut sequence consists of 2 gsettings, things may break if a user manipulates the gsettings directly via CLI or dconf editor instead of going through the preference window where I do the state syncing. I don't expect this to be big issue though since it's not a common thing to do.

There might be more issues, but I haven't found them yet. I will update this post if I do.

## Conclusion

Keyboard shortcuts are easier to remember if the keys serve as a mnemonic or if there is a systematic structure to them.

Traditional shortcuts, triggered by a single combination of at least one modifier key and one non-modifier key, can be hard to remember because there are only a limited number of possible combinations. So if you have many shortcuts, the keys for a shortcut will end up looking random with no relation to the action they will trigger.

Keyboard shortcut sequences solve this problem. Shortutcut sequences are triggered by a sequence of key combinations rather than just one combination. This increases the amount of possible key combinations for one shortcut to practically infinity. That way the keys for a shortcut can always serve as a mnemonic for the action they perform. Some apps already offer these types of shortcut. Hopefully, in the future more apps or even operating systems support them natively. For now, I experimented with them in a GNOME extension, albeit in a pretty hacky manner.
