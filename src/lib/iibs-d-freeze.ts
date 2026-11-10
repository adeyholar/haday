/** Level D place ids, frozen before the coursebook string repair.
 *  A word id is a hash of the pointed word and its gloss. Only a place whose
 *  hash changes is listed. No lesson text here.
 */
export const D_SLOT_FREEZE: readonly { slot: string; id: string }[] = [
  { slot: "iibs-d-04-01", id: "iibs-d-po0ue2" },
];

/** Places whose pre-fix word id must chain to the id after the repair. */
export const D_REPAIR_SLOTS: readonly string[] = ["iibs-d-04-01"];

/** No second pass. Do not regenerate D_SLOT_FREEZE. */
export const D_PRIOR_IDS: readonly { slot: string; id: string }[] = [];

export const D_SPLITS: readonly { from: string; slots: readonly string[] }[] = [];
