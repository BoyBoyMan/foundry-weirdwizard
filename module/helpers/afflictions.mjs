export class WWAfflictions {
  /**
   * Checks if the actor can do the action he is trying to perform, with the relative attribute
   * @param actor                 The actor
   * @param actionType            The type of action: [action / challenge]
   * @param actionAttribute       The attribute name, lowercase
   * @returns {boolean}           True if the actor is blocked
  */
  static isActorBlocked(actor, actionType, actionAttribute) {
    actionAttribute = actionAttribute.toLowerCase();
    const isBlocked = actor.system.maluses.autoFail[actionType]?.[actionAttribute] > 0;
    if (isBlocked) {
      // TODO: more precise message? Currently it picks the first message
      let msg = actor.getEmbeddedCollection('ActiveEffect').find(effect => Boolean(effect.flags?.warningMessage))
        ?.flags.warningMessage;
      msg = msg ?? _loc(`WW.AutoFail${actionType.capitalize()}s`);
      ui.notifications.error(msg);
    }
    return isBlocked
  }

  static async clearAfflictions(actor) {
    if (!actor) return;
    
    const afflictions = actor
      .getEmbeddedCollection('ActiveEffect')
      .filter(e => e.statuses.size > 0)
      .filter(e => e.type = 'affliction')
      .map(e => e._id);
    await actor.deleteEmbeddedDocuments('ActiveEffect', afflictions);
  }

  /**
   * Builds the Afflictions Active Effects for the token quick menu from the world settings
   * @returns list of active effect data
  */
  static buildAll() {
    return Object.entries(this.afflictionsData()).map(([id, affliction]) =>
      this._buildAffliction(id, affliction)
    );
  }

  /**
   * A getter for data used by afflictions.
   */
  static afflictionsData() {
    return game.settings.get('weirdwizard', 'availableAfflictions');
  }

  /** Builds a single affliction's ActiveEffect data. */
  static _buildAffliction(id, affliction) {
    const { name, desc, img, changes = [] } = affliction;

    const description = desc || (
      id.includes('impaired')
        ? _loc('WW.Affliction.ImpairedDesc')
        : _loc(`${CONFIG.WW.AFFLICTIONS[id]}Desc`)
    );

    return {
      id,
      name,
      img,
      description,
      tint: '#FF0900',
      duration: { expiry: 'luckEnds' },
      system: {
        durationPreset: 'luckEnds',
        changes: changes.map(c => ({
          ...c,
          key: keyFromPreset(c.preset),
          phase: 'initial' // use initial so changes are considered during prepareDerivedData
        }))
      }
    };
  }
}

// Constants
const keyFromPreset = preset => {
  const [groupKey] = preset ? preset.split('.') : [];
  return CONFIG.WW.EFFECT_CHANGE_PRESET_DATA?.[groupKey]?.options?.[preset].key;
}