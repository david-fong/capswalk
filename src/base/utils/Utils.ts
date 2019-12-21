

/**
 * @returns
 * A shallow copy of the given object containing all instance fields
 * belonging to the object and not to any of its prototypes. Suitable
 * for sending over an internet connection.
 * 
 * **Important:** We don't actually need this! Socket.io implicitly
 * sends objects serialized as JSON.
 * 
 * @param obj - The object to create a shallow copy of with no prototype.
 */
export const noProto = <T extends object>(obj: T): T => {
    return Object.assign(Object.create(null), obj);
};
