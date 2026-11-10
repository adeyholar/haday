/** Level B place ids, frozen before the coursebook string repair.
 *  A word id is a hash of the pointed word and its gloss. Only a place whose
 *  hash changes is listed. No lesson text here.
 */
export const B_SLOT_FREEZE: readonly { slot: string; id: string }[] = [
  { slot: "iibs-b-18-08", id: "iibs-b-x412qb" },
  { slot: "iibs-b-26-05", id: "iibs-b-a1u5id" },
];

/** Places whose pre-fix word id must chain to the id after the repair. */
export const B_REPAIR_SLOTS: readonly string[] = ["iibs-b-18-08", "iibs-b-26-05"];

/** No second pass. Do not regenerate B_SLOT_FREEZE. */
export const B_PRIOR_IDS: readonly { slot: string; id: string }[] = [];

export const B_SPLITS: readonly { from: string; slots: readonly string[] }[] = [];
