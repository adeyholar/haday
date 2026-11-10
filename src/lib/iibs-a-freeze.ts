/** Level A place ids, frozen before the coursebook string repair.
 *  A word id is a hash of the pointed word and its gloss. Only a place whose
 *  hash changes is listed. No lesson text here.
 */
export const A_SLOT_FREEZE: readonly { slot: string; id: string }[] = [
  { slot: "iibs-a-08-02", id: "iibs-a-1et6eo4" },
  { slot: "iibs-a-09-02", id: "iibs-a-txnp37" },
  { slot: "iibs-a-14-20", id: "iibs-a-rykh6t" },
];

/** Places whose pre-fix word id must chain to the id after the repair. */
export const A_REPAIR_SLOTS: readonly string[] = ["iibs-a-08-02", "iibs-a-09-02", "iibs-a-14-20"];

/** No second pass. Do not regenerate A_SLOT_FREEZE. */
export const A_PRIOR_IDS: readonly { slot: string; id: string }[] = [];

export const A_SPLITS: readonly { from: string; slots: readonly string[] }[] = [];
