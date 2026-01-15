

function deepFreeze(obj) {
  
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

export const USER_ROLES = deepFreeze({
  USER: "USER",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
});

export const REQUEST_STATUS = deepFreeze({
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  ENROUTE: "ENROUTE",     
  ARRIVED: "ARRIVED",     
  PICKED_UP: "PICKED_UP", 
  COMPLETED: "COMPLETED", 
  CANCELLED: "CANCELLED",
});

export const AMBULANCE_TYPE = deepFreeze({
  BLS: "BLS",
  ALS: "ALS",
});

export const SEVERITY_LEVEL = deepFreeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});


const constants = {
  USER_ROLES,
  REQUEST_STATUS,
  AMBULANCE_TYPE,
  SEVERITY_LEVEL,
};

export default deepFreeze(constants);