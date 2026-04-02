import { REQUEST_STATUS } from "../constants/enums.js";

/*
====================================================
✅ STEP 3.1 — VALID STATUS FLOW (LIFECYCLE)
====================================================

DISPATCHED → ENROUTE → ARRIVED → PICKED_UP → COMPLETED
CANCELLED handled separately
*/

export const STATUS_FLOW = Object.freeze({
    [REQUEST_STATUS.DISPATCHED]: [REQUEST_STATUS.ENROUTE],

    [REQUEST_STATUS.ENROUTE]: [REQUEST_STATUS.ARRIVED],

    [REQUEST_STATUS.ARRIVED]: [REQUEST_STATUS.PICKED_UP],

    [REQUEST_STATUS.PICKED_UP]: [REQUEST_STATUS.COMPLETED],
});


/*
====================================================
✅ STEP 3.2 — TRANSITION VALIDATION
====================================================
Checks if nextStatus is allowed from currentStatus
*/

export const isValidTransition = (currentStatus, nextStatus) => {
    if (!currentStatus || !nextStatus) return false;

    const allowedNext = STATUS_FLOW[currentStatus] || [];

    return allowedNext.includes(nextStatus);
};


/*
====================================================
✅ STEP 3.3 — CANCEL RULES
====================================================
Driver/Admin can cancel only before PICKED_UP
*/

export const canCancel = (currentStatus) => {
    return [
        REQUEST_STATUS.DISPATCHED,
        REQUEST_STATUS.ENROUTE,
        REQUEST_STATUS.ARRIVED,
    ].includes(currentStatus);
};


/*
====================================================
✅ STEP 3.4 — TERMINAL STATE CHECK
====================================================
Once completed/cancelled → no further updates allowed
*/

export const isTerminalStatus = (status) => {
    return [
        REQUEST_STATUS.COMPLETED,
        REQUEST_STATUS.CANCELLED,
    ].includes(status);
};


/*
====================================================
✅ STEP 3.5 — GET NEXT ALLOWED STATES (UTILITY)
====================================================
Helpful for frontend / debugging / validation
*/

export const getNextAllowedStatuses = (currentStatus) => {
    return STATUS_FLOW[currentStatus] || [];
};