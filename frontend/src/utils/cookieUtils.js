/**
 * Set a cookie with a given name, value, and optional expiration in days.
 * If days is null/undefined, it creates a session cookie (clears on browser close).
 * @param {string} name - Name of the cookie
 * @param {string} value - Value to store
 * @param {number|null} days - Number of days until expiration (null for session cookie)
 */
export const setCookie = (name, value, days = null) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
};

/**
 * Get a cookie value by name.
 * @param {string} name - Name of the cookie to retrieve
 * @returns {string|null} - The cookie value or null if not found
 */
export const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

/**
 * Delete a cookie by name.
 * @param {string} name - Name of the cookie to delete
 */
export const deleteCookie = (name) => {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
