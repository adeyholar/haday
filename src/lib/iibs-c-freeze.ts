/** Level C place ids, frozen before the coursebook string repair.
 *  A word id is a hash of the pointed word and its gloss. Only a place whose
 *  hash changes is listed. No lesson text here.
 */
export const C_SLOT_FREEZE: readonly { slot: string; id: string }[] = [
  { slot: "iibs-c-09-05", id: "iibs-c-1xgsae3" },
];

/** Places whose pre-fix word id must chain to the id after the repair. */
export const C_REPAIR_SLOTS: readonly string[] = ["iibs-c-09-05"];

/** No second pass. Do not regenerate C_SLOT_FREEZE. */
export const C_PRIOR_IDS: readonly { slot: string; id: string }[] = [];

export const C_SPLITS: readonly { from: string; slots: readonly string[] }[] = [];
