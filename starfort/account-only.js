/** Production feature boundary. Guest battles and local rewards are retired in v2.32.
 * Old save modules remain readable for compatibility/testing but cannot be entered via the UI. */
export const ACCOUNT_ONLY=true;
const legacyDataKeys=Object.freeze([
 'welcome','quickBot','trial','retryStage','recoveryKey','cloudAction','accountTransfer',
 'labyrinthMove','cosmeticInterest','seasonTitle','claimContract','battleStance',
 'ability','target','battleSpeed','combatToggle'
]);
const legacyAttributes=Object.freeze([
 'data-export-save','data-import-save','data-labyrinth-complete','data-training-open',
 'data-retry-stage','data-account-transfer','data-guild-test-register'
]);
export function isLegacyOnlyAction(button){
 if(!button||typeof button!=='object')return false;
 if(legacyDataKeys.some(key=>button.dataset?.[key]!==undefined))return true;
 return legacyAttributes.some(attr=>button.hasAttribute?.(attr));
}
export function normalizeOnlineView(view){
 return ['expedition','labyrinth','training'].includes(view)?'campaign':view;
}
