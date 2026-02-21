/**
 * Validates if the provided string is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates if the password meets the minimum requirements.
 * Requirement: Minimum 6 characters.
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
    return password && password.length >= 6;
};
